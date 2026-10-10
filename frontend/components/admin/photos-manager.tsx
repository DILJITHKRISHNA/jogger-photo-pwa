"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, CheckSquare, Download, ImageOff, Loader2, Square, Trash2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError, downloadAuthenticated, resolveMediaUrl } from "@/lib/api-client";
import { useCategories } from "@/features/catalogue/use-categories";
import { useAdminProducts } from "@/features/admin/use-products";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface UploadSummary {
  total: number;
  success: number;
  newCount: number;
  replacedCount: number;
  errorCount: number;
  uncategorisedCount?: number;
  errors: { row: number; message: string }[];
}

const BATCH_SIZE = 25;
const UPLOAD_CONCURRENCY = 3; // parallel requests; the API rate limit is 100/min
const COMPRESS_CONCURRENCY = 4; // photos resized at once inside a batch
const COMPRESS_TIMEOUT_MS = 20_000;
const MAX_UPLOAD_MB = 25; // keep in sync with the API per-file limit (products.controller.ts)
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
const MAX_EDGE_PX = 1600;

/** Runs `worker` over `items` with at most `limit` in flight at once. */
async function runPool<T>(items: T[], limit: number, worker: (item: T, index: number) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        await worker(items[i], i);
      }
    }),
  );
}

/** Stem used to detect files that map to the same Article + Colour product. */
function productStem(name: string): string {
  const dot = name.lastIndexOf(".");
  return (dot > 0 ? name.slice(0, dot) : name).trim().toUpperCase().replace(/\s+/g, " ");
}

/**
 * Downscales large photos (decoded at reduced size, so full-resolution
 * bitmaps never sit in memory). Falls back to the original file if the
 * photo is already small, can't be decoded, or takes too long.
 */
async function compressImage(file: File): Promise<File> {
  if (file.size <= 1.5 * 1024 * 1024) return file;

  const work = async (): Promise<File> => {
    const probe = await createImageBitmap(file, { imageOrientation: "from-image" });
    const { width, height } = probe;
    probe.close();
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
      resizeWidth: targetW,
      resizeHeight: targetH,
      resizeQuality: "medium",
    });
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
    bitmap.close();

    const type = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.8));
    canvas.width = canvas.height = 0; // release canvas memory
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name, { type, lastModified: file.lastModified });
  };

  try {
    return await Promise.race([
      work(),
      new Promise<File>((resolve) => setTimeout(() => resolve(file), COMPRESS_TIMEOUT_MS)),
    ]);
  } catch {
    return file;
  }
}

export function PhotosManager() {
  const { categories, loading: categoriesLoading } = useCategories(true);
  const { products, setProducts, loading: productsLoading, refresh } = useAdminProducts();

  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ prepared: number; uploaded: number; total: number } | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [lastSummary, setLastSummary] = useState<UploadSummary | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<Product | "selected" | null>(null);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "Uncategorised";

  const filteredProducts = useMemo(() => {
    if (filterCategoryId === "all") return products;
    return products.filter((p) => p.categoryId === filterCategoryId);
  }, [products, filterCategoryId]);

  async function handleDownloadMasterTemplate() {
    setDownloadingTemplate(true);
    try {
      await downloadAuthenticated("/master/template", "master-template.xlsx");
      toast.success("Master Excel template downloaded");
    } catch {
      toast.error("Couldn't download the template");
    } finally {
      setDownloadingTemplate(false);
    }
  }

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...incoming]);
  }

  async function handleUpload() {
    if (files.length === 0) {
      toast.error("Select at least one photo first");
      return;
    }

    // Files that map to the same Article + Colour would race each other when
    // uploaded in parallel — keep the last one, report the rest.
    const lastByStem = new Map<string, File>();
    files.forEach((f) => lastByStem.set(productStem(f.name), f));
    const queue = files.filter((f) => lastByStem.get(productStem(f.name)) === f);

    const totalFiles = files.length;
    setUploading(true);
    setProgress({ prepared: 0, uploaded: 0, total: totalFiles });

    const summary: UploadSummary = {
      total: totalFiles,
      success: 0,
      newCount: 0,
      replacedCount: 0,
      errorCount: 0,
      uncategorisedCount: 0,
      errors: [],
    };
    const failed: File[] = [];
    let prepared = totalFiles - queue.length;
    let uploaded = 0;

    if (queue.length < files.length) {
      const skipped = files.length - queue.length;
      summary.errorCount += skipped;
      summary.errors.push({
        row: 0,
        message: `${skipped} file(s) skipped: same Article + Colour appears more than once in this selection (last one kept)`,
      });
    }

    const batches: File[][] = [];
    for (let i = 0; i < queue.length; i += BATCH_SIZE) batches.push(queue.slice(i, i + BATCH_SIZE));

    const publish = () => setProgress({ prepared, uploaded, total: totalFiles });

    try {
      // Each worker takes a batch: shrink its photos, upload it, move on. Only
      // a few batches are ever in memory, so 2000 photos behave like 100.
      await runPool(batches, UPLOAD_CONCURRENCY, async (batch, batchIndex) => {
        const ready: { original: File; upload: File }[] = [];
        await runPool(batch, COMPRESS_CONCURRENCY, async (original) => {
          const upload = await compressImage(original);
          prepared += 1;
          publish();
          if (upload.size > MAX_UPLOAD_BYTES) {
            summary.errorCount += 1;
            summary.errors.push({
              row: batchIndex * BATCH_SIZE + 1,
              message: `${original.name}: still larger than ${MAX_UPLOAD_MB} MB after resizing`,
            });
            failed.push(original);
          } else {
            ready.push({ original, upload });
          }
        });

        if (ready.length > 0) {
          const formData = new FormData();
          ready.forEach(({ upload }) => formData.append("files", upload));
          // One failing batch must not abort the rest — record it and carry on.
          try {
            const data = await apiFetch<UploadSummary>("/products/photos", {
              method: "POST",
              body: formData,
            });
            summary.success += data.success;
            summary.newCount += data.newCount;
            summary.replacedCount += data.replacedCount;
            summary.errorCount += data.errorCount;
            summary.uncategorisedCount =
              (summary.uncategorisedCount ?? 0) + (data.uncategorisedCount ?? 0);
            summary.errors.push(...data.errors);
          } catch (error) {
            const reason = error instanceof ApiError ? error.message : "Upload failed";
            summary.errorCount += ready.length;
            ready.forEach(({ original }) => {
              summary.errors.push({ row: batchIndex * BATCH_SIZE + 1, message: `${original.name}: ${reason}` });
              failed.push(original);
            });
          }
        }

        uploaded += batch.length;
        publish();
      });

      setLastSummary(summary);
      // Keep only the files that did not upload so a retry doesn't re-send everything.
      setFiles(failed);
      if (inputRef.current) inputRef.current.value = "";
      await refresh();

      if (summary.errorCount === 0) {
        toast.success(
          `Uploaded ${summary.success} photo${summary.success === 1 ? "" : "s"} successfully`,
        );
      } else {
        toast.warning(`Uploaded ${summary.success}, ${summary.errorCount} skipped — see details below`);
      }
    } catch (error) {
      setLastSummary(summary);
      toast.error(error instanceof ApiError ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    const ids =
      pendingDelete === "selected" ? [...selected] : [pendingDelete.id];
    if (ids.length === 0) return;

    setDeleting(true);
    try {
      if (ids.length === 1) {
        await apiFetch(`/products/${ids[0]}`, { method: "DELETE" });
      } else {
        await Promise.all(ids.map((id) => apiFetch(`/products/${id}`, { method: "DELETE" })));
      }
      setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
      setSelected(new Set());
      setSelectMode(false);
      toast.success(ids.length === 1 ? "Photo deleted" : `${ids.length} photos deleted`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Delete failed");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-bold">Bulk photo upload</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload every photo in one go. Filenames must be{" "}
          <span className="font-mono font-semibold">ARTICLE COLOUR.jpg</span> — e.g.{" "}
          <span className="font-mono">1001 BRWN.jpg</span>. Categories come from the{" "}
          <Link href="/admin/upload/master" className="font-semibold text-primary underline">
            Master Excel
          </Link>
          , not from this screen.
        </p>
        <Button
          variant="outline"
          className="mt-3"
          disabled={downloadingTemplate}
          onClick={handleDownloadMasterTemplate}
        >
          {downloadingTemplate ? <Loader2 className="animate-spin" /> : <Download />}
          Download Master Excel template
        </Button>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
          )}
        >
          <UploadCloud className="size-7 text-muted-foreground" />
          <p className="text-sm font-semibold">Drop photos here or tap to browse</p>
          <p className="text-xs text-muted-foreground">JPG, PNG or WebP — multiple files supported</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </label>

        {files.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold">{files.length} file(s) selected</span>
            <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
              Clear
            </Button>
          </div>
        )}

        <Button className="mt-4 w-full sm:w-auto" disabled={uploading} onClick={handleUpload}>
          {uploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
          {uploading
            ? `Preparing ${progress?.prepared ?? 0} · Uploaded ${progress?.uploaded ?? 0} / ${progress?.total ?? files.length}`
            : `Upload ${files.length > 0 ? `${files.length} photo${files.length === 1 ? "" : "s"}` : ""}`}
        </Button>

        {lastSummary && (
          <div className="mt-4 flex flex-col gap-2">
            <Alert variant={lastSummary.errorCount > 0 ? "warning" : "success"}>
              {lastSummary.errorCount > 0 ? <AlertTriangle /> : <CheckCircle2 />}
              <AlertTitle>
                {lastSummary.success} uploaded ({lastSummary.newCount} new,{" "}
                {lastSummary.replacedCount} replaced)
                {lastSummary.errorCount > 0 ? `, ${lastSummary.errorCount} skipped` : ""}
              </AlertTitle>
              {lastSummary.errorCount > 0 && (
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {lastSummary.errors.slice(0, 8).map((e, i) => (
                      <li key={i}>{e.message}</li>
                    ))}
                  </ul>
                  {lastSummary.errors.length > 8 && <p>+{lastSummary.errors.length - 8} more</p>}
                </AlertDescription>
              )}
            </Alert>
            {(lastSummary.uncategorisedCount ?? 0) > 0 && (
              <Alert variant="warning">
                <AlertTriangle />
                <AlertTitle>
                  {lastSummary.uncategorisedCount} photo{lastSummary.uncategorisedCount === 1 ? "" : "s"} had no Master Excel match
                </AlertTitle>
                <AlertDescription>
                  They were saved as Uncategorised. Upload or update the{" "}
                  <Link href="/admin/upload/master" className="font-semibold underline">
                    Master Excel
                  </Link>{" "}
                  with Article, Colour and Category so they appear in the right Bulk Photos group.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Photo library ({filteredProducts.length})</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filterCategoryId} onValueChange={(value) => setFilterCategoryId(value ?? "all")}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All categories">
                  {(value: string) => (value === "all" || !value ? "All categories" : categoryName(value))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filteredProducts.length > 0 &&
              (selectMode ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelected(new Set(filteredProducts.map((p) => p.id)))}
                  >
                    <CheckSquare /> All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                    <Square /> None
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={exitSelectMode} aria-label="Cancel selection">
                    <X />
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setSelectMode(true)}>
                  <CheckSquare /> Select
                </Button>
              ))}
          </div>
        </div>

        {selectMode && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
            <p className="text-xs font-semibold text-muted-foreground">{selected.size} selected</p>
            <Button
              variant="destructive"
              size="sm"
              disabled={selected.size === 0}
              onClick={() => setPendingDelete("selected")}
            >
              <Trash2 /> Delete selected
            </Button>
          </div>
        )}

        {categoriesLoading || productsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
            <ImageOff className="size-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No photos here yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={cn(
                  "relative overflow-hidden rounded-xl border bg-card shadow-sm",
                  selectMode && selected.has(product.id) ? "border-primary ring-2 ring-primary/30" : "border-border",
                )}
              >
                {selectMode ? (
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => toggleSelected(product.id)}
                  >
                    <div className="aspect-square overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveMediaUrl(product.photoUrl)}
                        alt={`${product.article} ${product.colour}`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </button>
                ) : (
                  <div className="aspect-square overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveMediaUrl(product.photoUrl)}
                      alt={`${product.article} ${product.colour}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                {selectMode ? (
                  <button
                    type="button"
                    onClick={() => toggleSelected(product.id)}
                    className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full bg-black/70 text-white shadow-sm backdrop-blur-sm"
                    aria-label={selected.has(product.id) ? "Deselect photo" : "Select photo"}
                  >
                    {selected.has(product.id) ? (
                      <CheckSquare className="size-3.5" />
                    ) : (
                      <Square className="size-3.5" />
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPendingDelete(product)}
                    className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full bg-black/70 text-white shadow-sm backdrop-blur-sm hover:bg-destructive"
                    aria-label={`Delete photo ${product.article} ${product.colour}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
                <div className="p-2">
                  <p className="truncate text-xs font-bold">{product.article}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {product.colour} · {categoryName(product.categoryId)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingDelete === "selected"
                ? `Delete ${selected.size} photo${selected.size === 1 ? "" : "s"}?`
                : `Delete photo ${pendingDelete?.article} ${pendingDelete?.colour}?`}
            </DialogTitle>
            <DialogDescription>
              {pendingDelete === "selected"
                ? "They will disappear from Search, Bulk Photos, Stock, Scheme and New Model immediately."
                : "It will disappear from Search, Bulk Photos, Stock, Scheme and New Model immediately."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
