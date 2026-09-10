"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, CheckSquare, ImageOff, Loader2, Square, Trash2, UploadCloud, X } from "lucide-react";
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
import { apiFetch, ApiError, resolveMediaUrl } from "@/lib/api-client";
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

export function PhotosManager() {
  const { categories, loading: categoriesLoading } = useCategories(true);
  const { products, setProducts, loading: productsLoading, refresh } = useAdminProducts();

  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...incoming]);
  }

  async function handleUpload() {
    if (files.length === 0) {
      toast.error("Select at least one photo first");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const data = await apiFetch<UploadSummary>("/products/photos", {
        method: "POST",
        body: formData,
      });

      setLastSummary(data);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      await refresh();

      if (data.errorCount === 0) {
        toast.success(`Uploaded ${data.success} photo${data.success === 1 ? "" : "s"}`);
      } else {
        toast.warning(`Uploaded ${data.success}, ${data.errorCount} skipped — see details below`);
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Upload failed");
    } finally {
      setUploading(false);
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
          Upload {files.length > 0 ? `${files.length} photo${files.length === 1 ? "" : "s"}` : ""}
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
