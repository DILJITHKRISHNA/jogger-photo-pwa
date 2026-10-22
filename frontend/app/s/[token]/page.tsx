"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Download, ImageOff, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { BrandMark } from "@/components/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { apiUrl } from "@/lib/api-client";
import {
  IOS_BATCH_SIZE,
  downloadPhotos,
  filesIfReady,
  loadPhotoFile,
  prefetchPhotoFiles,
  releasePhotoFiles,
  savesViaShareSheet,
  shareFilesToSave,
  type SavablePhoto,
} from "@/lib/client/save-photos";
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

const noSubscribe = () => () => {};

type SaveState =
  | { kind: "idle" }
  | { kind: "preparing" }
  /** iPhone: batch `batch` is loaded and waits for a tap to open the share sheet. */
  | { kind: "ready"; batch: number }
  | { kind: "downloading"; done: number }
  | { kind: "done" };

/*
 * The public page behind a "Share as link" link — what the customer sees.
 * No sign-in; it only ever shows the photos that were shared (article +
 * colour, no stock or prices), and stops working when the link expires.
 */
export default function SharedPhotosPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [open, setOpen] = useState<number | null>(null);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  // Depends on the phone, which the server can't know — false while server-rendering.
  const viaShareSheet = useSyncExternalStore(noSubscribe, savesViaShareSheet, () => false);

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

  const photos = useMemo(() => (state.status === "ready" ? state.link.photos : []), [state]);
  const savable = useMemo<SavablePhoto[]>(
    () => photos.map((photo) => ({ url: photoUrl(photo), filename: `${photo.article} ${photo.colour}.jpg` })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- photoUrl only depends on token
    [photos, token],
  );
  const batches = useMemo(() => {
    const result: SavablePhoto[][] = [];
    for (let i = 0; i < savable.length; i += IOS_BATCH_SIZE) result.push(savable.slice(i, i + IOS_BATCH_SIZE));
    return result;
  }, [savable]);

  // iPhone: load the first batch up front, so "Save all" opens the share sheet straight from the tap.
  useEffect(() => {
    if (viaShareSheet && batches.length > 0) prefetchPhotoFiles(batches[0]);
  }, [viaShareSheet, batches]);

  async function saveBatch(index: number) {
    const batch = batches[index];
    const files = filesIfReady(batch);
    if (!files) {
      // Still loading — the share sheet only opens straight from a tap, so
      // finish loading, then ask for one more tap.
      setSave({ kind: "preparing" });
      try {
        await Promise.all(batch.map(loadPhotoFile));
        setSave({ kind: "ready", batch: index });
        toast("Photos ready — tap Save again");
      } catch {
        setSave({ kind: "idle" });
        toast.error("Couldn't load the photos. Check your connection and try again.");
      }
      return;
    }

    if (index + 1 < batches.length) prefetchPhotoFiles(batches[index + 1]);
    const outcome = await shareFilesToSave(files).catch(() => "failed" as const);
    if (outcome === "failed") {
      toast.error("Couldn't open the save options");
      return;
    }
    if (outcome !== "saved") {
      // Closed without saving (or the tap expired) — the same batch stays ready for the next tap.
      setSave(index === 0 && outcome === "cancelled" ? { kind: "idle" } : { kind: "ready", batch: index });
      return;
    }

    releasePhotoFiles(batch);
    if (index + 1 < batches.length) {
      setSave({ kind: "ready", batch: index + 1 });
      const savedSoFar = Math.min((index + 1) * IOS_BATCH_SIZE, savable.length);
      toast.success(`${savedSoFar} of ${savable.length} done — tap "Save next" for the rest`);
    } else {
      setSave({ kind: "done" });
    }
  }

  async function handleSaveAll() {
    if (save.kind === "preparing" || save.kind === "downloading") return;
    if (viaShareSheet) return saveBatch(save.kind === "ready" ? save.batch : 0);

    setSave({ kind: "downloading", done: 0 });
    const saved = await downloadPhotos(savable, (done) => setSave({ kind: "downloading", done }));
    setSave({ kind: "done" });
    if (saved === savable.length) {
      toast.success(`${saved} photo${saved === 1 ? "" : "s"} saved — find them in your Gallery, in the Download album`);
    } else {
      toast.error(`${savable.length - saved} of ${savable.length} photos couldn't be saved — tap Save all to try again`);
    }
  }

  /** The viewer's "Save photo" on iPhone: share sheet → "Save Image" puts it in Photos. */
  async function saveOneViaShareSheet(photo: SavablePhoto) {
    const files = filesIfReady([photo]);
    if (!files) {
      prefetchPhotoFiles([photo]);
      toast("Getting the photo ready — tap Save photo again");
      return;
    }
    const outcome = await shareFilesToSave(files).catch(() => "cancelled" as const);
    if (outcome === "needs-tap") toast("Tap Save photo again");
  }

  const saveLabel = (() => {
    switch (save.kind) {
      case "preparing":
        return "Preparing…";
      case "downloading":
        return `Saving ${save.done}/${savable.length}`;
      case "done":
        return "Saved";
      case "ready":
        if (save.batch > 0) return `Save next ${batches[save.batch].length}`;
        return batches.length > 1 ? `Save 1–${batches[0].length}` : "Save all";
      default:
        return batches.length > 1 && viaShareSheet ? `Save 1–${batches[0].length}` : "Save all";
    }
  })();

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
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={save.kind === "preparing" || save.kind === "downloading"}
              className={cn(buttonVariants({ size: "sm" }), "tabular-nums")}
            >
              {save.kind === "preparing" || save.kind === "downloading" ? (
                <Loader2 className="animate-spin" />
              ) : save.kind === "done" ? (
                <Check />
              ) : (
                <Download />
              )}
              {saveLabel}
            </button>
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
            <p className="mb-3 text-xs text-muted-foreground">
              {photos.length === 1
                ? "Tap the photo to see it bigger and save it."
                : viaShareSheet
                  ? `Tap the Save button, then "Save Images" to add them to your Photos${
                      batches.length > 1 ? ` (${IOS_BATCH_SIZE} at a time)` : ""
                    }. Or tap a photo to see it bigger.`
                  : 'Tap "Save all" to save every photo to your gallery, or tap a photo to see it bigger.'}
            </p>
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
          onSave={viaShareSheet ? () => void saveOneViaShareSheet(savable[open]) : undefined}
          onPrev={open > 0 ? () => setOpen(open - 1) : undefined}
          onNext={open < photos.length - 1 ? () => setOpen(open + 1) : undefined}
          onClose={() => setOpen(null)}
          onShow={viaShareSheet ? () => prefetchPhotoFiles([savable[open]]) : undefined}
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
  onSave,
  onShow,
}: {
  photo: SharedPhoto;
  position: string;
  src: string;
  downloadHref: string;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
  /** Replaces the plain download (iPhone: save through the share sheet). */
  onSave?: () => void;
  /** Called when a photo is shown — lets iPhone preload it for an instant save. */
  onShow?: () => void;
}) {
  useEffect(() => {
    onShow?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per photo
  }, [src]);

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
        <a
          href={downloadHref}
          onClick={
            onSave
              ? (event) => {
                  event.preventDefault();
                  onSave();
                }
              : undefined
          }
          className={cn(buttonVariants(), "flex-1")}
        >
          <Download /> Save photo
        </a>
        <button type="button" onClick={onNext} disabled={!onNext} className={navButton} aria-label="Next photo">
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
