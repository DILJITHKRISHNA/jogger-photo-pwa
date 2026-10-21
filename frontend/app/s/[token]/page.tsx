"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, ImageOff, Loader2, X } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { apiUrl } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface SharedPhoto {
  id: string;
  article: string;
  colour: string;
}

interface SharedLink {
  expiresAt: string;
  photos: SharedPhoto[];
}

type LoadState =
  | { status: "loading" }
  | { status: "ready"; link: SharedLink }
  | { status: "error"; message: string };

/*
 * The public page behind a "Share as link" link — what the customer sees.
 * No sign-in; it only ever shows the photos that were shared (article +
 * colour, no stock or prices), and stops working when the link expires.
 */
export default function SharedPhotosPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl(`/share-links/${encodeURIComponent(token)}`))
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) setState({ status: "ready", link: (await response.json()) as SharedLink });
        else
          setState({
            status: "error",
            message:
              response.status === 410
                ? "This link has expired. Ask your Jogger sales executive to send a new one."
                : "This link isn't valid. Check you have the full link, or ask for a new one.",
          });
      })
      .catch(() => {
        if (!cancelled)
          setState({ status: "error", message: "Couldn't load the photos. Check your connection and try again." });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const photoUrl = (photo: SharedPhoto, download = false) =>
    apiUrl(`/share-links/${encodeURIComponent(token)}/photos/${photo.id}${download ? "?download=1" : ""}`);

  const photos = state.status === "ready" ? state.link.photos : [];

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="safe-top sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2.5 px-4">
          <BrandMark className="size-9 rounded-xl" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-bold tracking-tight">Jogger Footwear</h1>
            {state.status === "ready" && (
              <p className="truncate text-[11px] text-muted-foreground">
                {photos.length} photo{photos.length === 1 ? "" : "s"} · link works until{" "}
                {new Date(state.link.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
              </p>
            )}
          </div>
          {photos.length > 1 && (
            // A cross-origin link can't use `download`, but the API sends the
            // ZIP as an attachment, so it saves instead of navigating away.
            <a
              href={apiUrl(`/share-links/${encodeURIComponent(token)}/zip`)}
              className={buttonVariants({ size: "sm" })}
            >
              <Download /> Save all
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4">
        {state.status === "loading" && (
          <div className="flex justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {state.status === "error" && (
          <p className="px-6 py-20 text-center text-sm font-semibold text-foreground">{state.message}</p>
        )}

        {state.status === "ready" && photos.length === 0 && (
          <p className="px-6 py-20 text-center text-sm font-semibold text-foreground">
            These photos are no longer available.
          </p>
        )}

        {photos.length > 0 && (
          <>
            <p className="mb-3 text-xs text-muted-foreground">Tap a photo to see it bigger and save it.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setOpen(index)}
                  className="block w-full rounded-xl text-left transition-transform active:scale-[0.97]"
                >
                  <Thumbnail src={photoUrl(photo)} alt={`${photo.article} ${photo.colour}`} />
                  <div className="mt-1.5 px-0.5">
                    <p className="truncate text-[13px] font-bold leading-tight">{photo.article}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{photo.colour}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>

      {open !== null && photos[open] && (
        <Viewer
          photo={photos[open]}
          position={`${open + 1} / ${photos.length}`}
          src={photoUrl(photos[open])}
          downloadHref={photoUrl(photos[open], true)}
          onPrev={open > 0 ? () => setOpen(open - 1) : undefined}
          onNext={open < photos.length - 1 ? () => setOpen(open + 1) : undefined}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

function Thumbnail({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  return (
    <div className="aspect-square w-full overflow-hidden rounded-xl bg-muted">
      {errored ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
          <ImageOff className="size-6" />
          <span className="text-[10px] font-medium">No photo</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}

function Viewer({
  photo,
  position,
  src,
  downloadHref,
  onPrev,
  onNext,
  onClose,
}: {
  photo: SharedPhoto;
  position: string;
  src: string;
  downloadHref: string;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev?.();
      if (event.key === "ArrowRight") onNext?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  const navButton = "flex size-11 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95" role="dialog" aria-modal="true">
      <div className="safe-top flex items-center gap-3 px-4 py-3 text-white">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{photo.article}</p>
          <p className="truncate text-xs text-white/70">
            {photo.colour} · {position}
          </p>
        </div>
        <button type="button" onClick={onClose} className={navButton} aria-label="Close">
          <X className="size-5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={src} src={src} alt={`${photo.article} ${photo.colour}`} className="max-h-full max-w-full object-contain" />
      </div>

      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={onPrev} disabled={!onPrev} className={navButton} aria-label="Previous photo">
          <ChevronLeft className="size-5" />
        </button>
        <a href={downloadHref} className={cn(buttonVariants(), "flex-1")}>
          <Download /> Save photo
        </a>
        <button type="button" onClick={onNext} disabled={!onNext} className={navButton} aria-label="Next photo">
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
