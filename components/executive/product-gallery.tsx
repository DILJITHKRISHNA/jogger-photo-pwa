"use client";

import { useMemo, useState } from "react";
import { CheckSquare, Download, Loader2, Share2, Square, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PhotoCard } from "@/components/executive/photo-card";
import {
  downloadPhotosAsZip,
  sharePhotos,
  type ShareablePhoto,
} from "@/lib/client/share";
import { filenameFor } from "@/lib/client/photo-filename";
import type { ProductView } from "@/types/product";

const ZIP_THRESHOLD = 8; // beyond this, prefer a single ZIP over many share/download prompts

export function ProductGallery({
  items,
  emptyTitle,
  emptyHint,
  zipName,
  groupByCategory = false,
}: {
  items: ProductView[];
  emptyTitle: string;
  emptyHint?: string;
  zipName: string;
  groupByCategory?: boolean;
}) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<"share" | "download" | null>(null);

  const groups = useMemo(() => {
    if (!groupByCategory) return [{ label: null as string | null, items }];
    const byCategory = new Map<string, ProductView[]>();
    for (const item of items) {
      const key = item.category ?? "Uncategorised";
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(item);
    }
    return Array.from(byCategory.entries()).map(([label, groupItems]) => ({
      label,
      items: groupItems,
    }));
  }, [items, groupByCategory]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(items.map((i) => i.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  function selectedPhotos(): ShareablePhoto[] {
    return items
      .filter((i) => selected.has(i.id))
      .map((i) => ({ url: i.photoUrl, filename: filenameFor(i) }));
  }

  async function handleShare() {
    const photos = selectedPhotos();
    if (photos.length === 0) return;
    setBusy("share");
    try {
      const result = await sharePhotos(photos, "Jogger Footwear");
      if (result === "shared") toast.success("Shared");
      else if (result === "downloaded") toast.success("Saved to your downloads");
    } catch {
      toast.error("Couldn't share those photos");
    } finally {
      setBusy(null);
    }
  }

  async function handleDownload() {
    const photos = selectedPhotos();
    if (photos.length === 0) return;
    setBusy("download");
    try {
      if (photos.length > 1) {
        await downloadPhotosAsZip(photos, zipName);
        toast.success(`Downloaded ${photos.length} photos as a ZIP`);
      } else {
        const link = document.createElement("a");
        link.href = photos[0].url;
        link.download = photos[0].filename;
        link.click();
      }
    } catch {
      toast.error("Download failed");
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 px-8 py-16 text-center">
        <p className="text-sm font-bold text-foreground">{emptyTitle}</p>
        {emptyHint && <p className="text-xs text-muted-foreground">{emptyHint}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="sticky top-14 z-20 flex flex-col gap-2 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">
            {selectMode
              ? `${selected.size} selected`
              : `${items.length} photo${items.length === 1 ? "" : "s"}`}
          </p>
          {selectMode ? (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                <CheckSquare /> All
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <Square /> None
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={exitSelectMode} aria-label="Cancel">
                <X />
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setSelectMode(true)}>
              <CheckSquare /> Select
            </Button>
          )}
        </div>

        {selectMode && selected.size > 0 && (
          <div className="flex gap-2">
            <Button className="flex-1" size="sm" disabled={busy !== null} onClick={handleShare}>
              {busy === "share" ? <Loader2 className="animate-spin" /> : <Share2 />}
              Share {selected.size > ZIP_THRESHOLD ? "" : "Selected"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              size="sm"
              disabled={busy !== null}
              onClick={handleDownload}
            >
              {busy === "download" ? <Loader2 className="animate-spin" /> : <Download />}
              {selected.size > 1 ? "Download ZIP" : "Download"}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 px-4 py-4">
        {groups.map((group) => (
          <div key={group.label ?? "all"}>
            {group.label && (
              <h3 className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                {group.label}
              </h3>
            )}
            <div className="grid grid-cols-2 gap-3">
              {group.items.map((item) => (
                <PhotoCard
                  key={item.id}
                  item={item}
                  selectMode={selectMode}
                  selected={selected.has(item.id)}
                  onToggle={() => toggle(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
