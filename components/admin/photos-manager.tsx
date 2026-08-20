"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ImageOff,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { fetchJson } from "@/lib/client/fetcher";
import { cn } from "@/lib/utils";
import type { Category, Product } from "@/types/product";

interface UploadSummary {
  total: number;
  success: number;
  newCount: number;
  replacedCount: number;
  errorCount: number;
  errors: { row: number; message: string }[];
}

export function PhotosManager({
  initialProducts,
  categories,
}: {
  initialProducts: Product[];
  categories: Category[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastSummary, setLastSummary] = useState<UploadSummary | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
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

  async function refreshProducts() {
    try {
      const data = await fetchJson<Product[]>("/api/admin/products");
      setProducts(data);
    } catch {
      // keep existing state — non-fatal
    }
  }

  async function handleUpload() {
    if (files.length === 0) {
      toast.error("Select at least one photo first");
      return;
    }
    if (!categoryId) {
      toast.error("Choose a category for these photos");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("categoryId", categoryId);
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/admin/photos/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Upload failed");

      setLastSummary(data);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      await refreshProducts();

      if (data.errorCount === 0) {
        toast.success(`Uploaded ${data.success} photo${data.success === 1 ? "" : "s"}`);
      } else {
        toast.warning(`Uploaded ${data.success}, ${data.errorCount} skipped — see details below`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await fetchJson(`/api/admin/products/${pendingDelete.id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== pendingDelete.id));
      toast.success("Photo deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
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
          Filenames must be <span className="font-mono font-semibold">ARTICLE COLOUR.jpg</span> — e.g.{" "}
          <span className="font-mono">1001 BRWN.jpg</span>. Article + Colour are read straight from the
          name, so nothing to type per photo.
        </p>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="text-xs font-semibold text-muted-foreground">Category</span>
          <Select value={categoryId} onValueChange={(value) => setCategoryId(value ?? "")}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Choose a category">
                {(value: string) => categoryName(value || null)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
            dragOver ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
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
                  {lastSummary.errors.length > 8 && (
                    <p>+{lastSummary.errors.length - 8} more</p>
                  )}
                </AlertDescription>
              )}
            </Alert>
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Photo library ({filteredProducts.length})</h2>
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
        </div>

        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
            <ImageOff className="size-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No photos here yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.photoUrl}
                    alt={`${product.article} ${product.colour}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setPendingDelete(product)}
                  className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                  aria-label="Delete photo"
                >
                  <Trash2 className="size-3.5" />
                </button>
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
              Delete photo {pendingDelete?.article} {pendingDelete?.colour}?
            </DialogTitle>
            <DialogDescription>
              It will disappear from Search, Bulk Photos, Stock, Scheme and New Model immediately.
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
