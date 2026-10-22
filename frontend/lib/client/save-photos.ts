"use client";

/*
 * Saving a shared link's photos into the customer's phone gallery — no ZIP.
 *
 * A web page can't write to the photo library directly, so each phone gets
 * the route that ends up there:
 *  - iPhone / iPad: the share sheet, whose "Save N Images" puts the photos in
 *    the Photos app (Safari downloads would go to the Files app instead).
 *    Up to 100 photos per tap.
 *  - Android (and computers): each photo is downloaded as its own JPEG. They
 *    land in the Download folder, which Gallery / Google Photos show as an
 *    album. Chrome asks once to "allow multiple downloads".
 */

export interface SavablePhoto {
  url: string;
  filename: string;
}

/** Photos per share-sheet tap on iPhone. */
export const IOS_BATCH_SIZE = 100;
const MAX_CONCURRENT_LOADS = 4;
/** Gap between downloads — Chrome drops downloads fired back-to-back. */
const DOWNLOAD_GAP_MS = 250;

function isIOS(): boolean {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac, but with a touch screen.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** True when photos are saved through the share sheet (iPhone), false when downloaded. */
export function savesViaShareSheet(): boolean {
  if (typeof navigator === "undefined" || !isIOS()) return false;
  if (typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare !== "function") return true;
  return navigator.canShare({ files: [new File([""], "photo.jpg", { type: "image/jpeg" })] });
}

let activeLoads = 0;
const loadQueue: Array<() => void> = [];

async function withLoadSlot<T>(work: () => Promise<T>): Promise<T> {
  if (activeLoads >= MAX_CONCURRENT_LOADS) {
    await new Promise<void>((resolve) => loadQueue.push(resolve));
  }
  activeLoads += 1;
  try {
    return await work();
  } finally {
    activeLoads -= 1;
    loadQueue.shift()?.();
  }
}

const pendingFiles = new Map<string, Promise<File>>();
const readyFiles = new Map<string, File>();

/** The photo as a JPEG file — fetched once, then served from memory. */
export function loadPhotoFile(photo: SavablePhoto): Promise<File> {
  let pending = pendingFiles.get(photo.url);
  if (!pending) {
    pending = withLoadSlot(async () => {
      const response = await fetch(photo.url);
      if (!response.ok) throw new Error(`Could not load ${photo.filename}`);
      return new File([await response.blob()], photo.filename, { type: "image/jpeg" });
    }).then(
      (file) => {
        readyFiles.set(photo.url, file);
        return file;
      },
      (error: unknown) => {
        pendingFiles.delete(photo.url); // let a later tap retry
        throw error;
      },
    );
    pendingFiles.set(photo.url, pending);
  }
  return pending;
}

export function prefetchPhotoFiles(photos: SavablePhoto[]): void {
  for (const photo of photos) loadPhotoFile(photo).catch(() => undefined);
}

/** The files for `photos` if every one is already loaded — so a tap can open the share sheet instantly. */
export function filesIfReady(photos: SavablePhoto[]): File[] | null {
  const files: File[] = [];
  for (const photo of photos) {
    const file = readyFiles.get(photo.url);
    if (!file) return null;
    files.push(file);
  }
  return files;
}

export function releasePhotoFiles(photos: SavablePhoto[]): void {
  for (const photo of photos) {
    pendingFiles.delete(photo.url);
    readyFiles.delete(photo.url);
  }
}

/**
 * Opens the share sheet with the files (the user then taps "Save Images").
 * "needs-tap" means the tap expired before the sheet could open — ask for another.
 */
export async function shareFilesToSave(files: File[]): Promise<"saved" | "cancelled" | "needs-tap"> {
  try {
    await navigator.share({ files });
    return "saved";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    if (error instanceof DOMException && error.name === "NotAllowedError") return "needs-tap";
    throw error;
  }
}

function saveBlob(blob: Blob, filename: string): void {
  // A same-origin blob: URL makes the browser honour `download` (the photos
  // come from the API's origin, where `download` would be ignored).
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Downloads each photo as its own JPEG, in order, reporting progress. Returns how many saved. */
export async function downloadPhotos(
  photos: SavablePhoto[],
  onProgress: (done: number) => void,
): Promise<number> {
  let saved = 0;
  for (let i = 0; i < photos.length; i++) {
    // Keep the next few loading while this one saves.
    prefetchPhotoFiles(photos.slice(i + 1, i + MAX_CONCURRENT_LOADS));
    const file = await loadPhotoFile(photos[i]).catch(() => null);
    if (file) {
      saveBlob(file, file.name);
      saved += 1;
    }
    releasePhotoFiles([photos[i]]);
    onProgress(i + 1);
    if (i < photos.length - 1) await new Promise((resolve) => setTimeout(resolve, DOWNLOAD_GAP_MS));
  }
  return saved;
}
