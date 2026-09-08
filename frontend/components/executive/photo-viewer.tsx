"use client";

import { useState } from "react";
import { Download, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { downloadPhoto, sharePhotos } from "@/lib/client/share";
import { filenameFor } from "@/lib/client/photo-filename";
import { resolveMediaUrl } from "@/lib/api-client";

export function PhotoViewer({
  article,
  colour,
  category,
  photoUrl,
}: {
  article: string;
  colour: string;
  category: string | null;
  photoUrl: string;
}) {
  const [busy, setBusy] = useState<"share" | "download" | null>(null);
  const filename = filenameFor({ article, colour, photoUrl });

  async function handleShare() {
    setBusy("share");
    try {
      const result = await sharePhotos([{ url: photoUrl, filename }], `${article} · ${colour}`);
      if (result === "shared") toast.success("Shared");
      else if (result === "downloaded") toast.success("Saved to your downloads");
    } catch {
      toast.error("Couldn't share this photo");
    } finally {
      setBusy(null);
    }
  }

  function handleDownload() {
    setBusy("download");
    downloadPhoto({ url: photoUrl, filename });
    setTimeout(() => setBusy(null), 400);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center bg-muted/40 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveMediaUrl(photoUrl)}
          alt={`${article} ${colour}`}
          className="max-h-[62dvh] w-full rounded-2xl object-contain"
        />
      </div>

      <div className="flex flex-col gap-4 border-t border-border bg-background px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-extrabold tracking-tight">{article}</p>
            <p className="text-sm font-medium text-muted-foreground">{colour}</p>
          </div>
          {category && (
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              {category}
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <Button className="h-12 flex-1 text-[15px]" disabled={busy !== null} onClick={handleShare}>
            {busy === "share" ? <Loader2 className="animate-spin" /> : <Share2 />}
            Share
          </Button>
          <Button
            variant="outline"
            className="h-12 flex-1 text-[15px]"
            disabled={busy !== null}
            onClick={handleDownload}
          >
            {busy === "download" ? <Loader2 className="animate-spin" /> : <Download />}
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}
