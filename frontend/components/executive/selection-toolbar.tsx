"use client";

import { useEffect, useState } from "react";
import { CheckSquare, Download, Link2, Loader2, Share2, Square, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  downloadPhotos,
  prefetchPhotos,
  sharePhotos,
  type ShareablePhoto,
} from "@/lib/client/share";
import { createShareLink, sendShareLink } from "@/lib/client/share-link";
import { filenameFor } from "@/lib/client/photo-filename";
import { cn } from "@/lib/utils";
import type { ProductView } from "@/lib/types";

const ZIP_THRESHOLD = 8; // beyond this, prefer a single ZIP over many share/download prompts

/**
 * The select bar shared by every photo list (bulk galleries, search results):
 * photo count / "N selected", Select · All · None · Cancel, and Share,
 * Download and Share as link for the selected photos. "All" selects every
 * photo in `items` — only what's on screen.
 */
export function SelectionToolbar({
  items,
  selectMode,
  onSelectModeChange,
  selected,
  onSelectedChange,
  zipName,
  className,
}: {
  items: ProductView[];
  selectMode: boolean;
  onSelectModeChange: (selectMode: boolean) => void;
  selected: Set<string>;
  onSelectedChange: (selected: Set<string>) => void;
  zipName: string;
  className?: string;
}) {
  const [busy, setBusy] = useState<"share" | "download" | "link" | null>(null);

  function exitSelectMode() {
    onSelectModeChange(false);
    onSelectedChange(new Set());
  }

  const selectedItems = () => items.filter((i) => selected.has(i.id));

  function selectedPhotos(): ShareablePhoto[] {
    return selectedItems().map((i) => ({ url: i.photoUrl, filename: filenameFor(i) }));
  }

  // Fetch selected photos in the background so Share opens the share sheet
  // straight from the tap, however many are selected.
  useEffect(() => {
    prefetchPhotos(
      items
        .filter((i) => selected.has(i.id))
        .map((i) => ({ url: i.photoUrl, filename: filenameFor(i) })),
    );
  }, [items, selected]);

  // Only selections among the photos on screen count.
  const selectedCount = items.reduce((count, i) => count + (selected.has(i.id) ? 1 : 0), 0);

  async function handleShare() {
    const photos = selectedPhotos();
    if (photos.length === 0) return;
    setBusy("share");
    try {
      const result = await sharePhotos(photos, "Jogger Footwear");
      if (result === "shared") toast.success("Shared");
      else if (result === "downloaded") toast.success("Sharing isn't supported here — saved to your downloads");
    } catch {
      toast.error("Couldn't share those photos");
    } finally {
      setBusy(null);
    }
  }

  async function handleShareLink() {
    const productIds = selectedItems().map((i) => i.id);
    if (productIds.length === 0) return;
    setBusy("link");
    try {
      const { url, count } = await createShareLink(productIds);
      const result = await sendShareLink(url, count);
      if (result === "shared") toast.success("Link shared");
    } catch {
      toast.error("Couldn't create the link");
    } finally {
      setBusy(null);
    }
  }

  async function handleDownload() {
    const photos = selectedPhotos();
    if (photos.length === 0) return;
    setBusy("download");
    try {
      await downloadPhotos(photos, zipName);
      if (photos.length > 1) toast.success(`Downloaded ${photos.length} photos as a ZIP`);
    } catch {
      toast.error("Download failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">
          {selectMode
            ? `${selectedCount} selected`
            : `${items.length} photo${items.length === 1 ? "" : "s"}`}
        </p>
        {selectMode ? (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => onSelectedChange(new Set(items.map((i) => i.id)))}>
              <CheckSquare /> All
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onSelectedChange(new Set())}>
              <Square /> None
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={exitSelectMode} aria-label="Cancel">
              <X />
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => onSelectModeChange(true)}>
            <CheckSquare /> Select
          </Button>
        )}
      </div>

      {selectMode && selectedCount > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button className="flex-1" size="sm" disabled={busy !== null} onClick={handleShare}>
            {busy === "share" ? <Loader2 className="animate-spin" /> : <Share2 />}
            Share {selectedCount > ZIP_THRESHOLD ? "" : "Selected"}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            size="sm"
            disabled={busy !== null}
            onClick={handleDownload}
          >
            {busy === "download" ? <Loader2 className="animate-spin" /> : <Download />}
            {selectedCount > 1 ? "Download ZIP" : "Download"}
          </Button>
          {/* One link for any number of photos — Android shares only 10 photos at a time. */}
          <Button
            variant="secondary"
            className="w-full"
            size="sm"
            disabled={busy !== null}
            onClick={handleShareLink}
          >
            {busy === "link" ? <Loader2 className="animate-spin" /> : <Link2 />}
            Share as link
          </Button>
        </div>
      )}
    </div>
  );
}
