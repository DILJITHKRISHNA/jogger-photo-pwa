"use client";

import { toast } from "sonner";

import { getAccessToken } from "@/lib/auth-token";
import { refreshSession, resolveMediaUrl, apiUrl } from "@/lib/api-client";

export interface ShareablePhoto {
  url: string;
  filename: string;
}

/*
 * Browsers only open the share sheet if navigator.share() is called right
 * after a tap ("user activation"). Fetching many photos *after* the tap takes
 * too long and the share is refused — so photos are fetched ahead of time
 * (as soon as they're selected / shown) and cached here, letting the Share
 * tap call navigator.share() immediately.
 */
const fileCache = new Map<string, Promise<File>>();
const readyFiles = new Map<string, File>();

function cacheKey(photo: ShareablePhoto): string {
  return `${resolveMediaUrl(photo.url)}|${photo.filename}`;
}

async function fetchFile(photo: ShareablePhoto): Promise<File> {
  const response = await fetch(resolveMediaUrl(photo.url));
  if (!response.ok) throw new Error(`Could not load ${photo.filename}`);
  const blob = await response.blob();
  return new File([blob], photo.filename, { type: blob.type || "image/jpeg" });
}

function loadFile(photo: ShareablePhoto): Promise<File> {
  const key = cacheKey(photo);
  let pending = fileCache.get(key);
  if (!pending) {
    pending = fetchFile(photo).then(
      (file) => {
        readyFiles.set(key, file);
        return file;
      },
      (error: unknown) => {
        fileCache.delete(key); // allow a retry later
        throw error;
      },
    );
    fileCache.set(key, pending);
  }
  return pending;
}

/** Start fetching photos in the background so a later Share tap is instant. */
export function prefetchPhotos(photos: ShareablePhoto[]): void {
  for (const photo of photos) loadFile(photo).catch(() => undefined);
}

function filesIfReady(photos: ShareablePhoto[]): File[] | null {
  const files: File[] = [];
  for (const photo of photos) {
    const file = readyFiles.get(cacheKey(photo));
    if (!file) return null;
    files.push(file);
  }
  return files;
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

function canShareFiles(files: File[]): boolean {
  return typeof navigator.canShare !== "function" || navigator.canShare({ files });
}

/**
 * Splits files into the fewest groups the browser accepts in one share —
 * some browsers cap the number or total size of shared files.
 */
function shareableChunks(files: File[]): File[][] {
  const chunks: File[][] = [];
  let start = 0;
  while (start < files.length) {
    // Largest run from `start` the browser accepts (canShare is a cheap, synchronous check).
    let end = files.length;
    while (end - start > 1 && !canShareFiles(files.slice(start, end))) end -= 1;
    chunks.push(files.slice(start, end));
    start = end;
  }
  return chunks;
}

function saveBlob(blob: Blob, filename: string): void {
  // A same-origin blob: URL makes the browser honour `download` — a direct
  // link to the API's photo URL (another origin) would just open the image.
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Saves one photo to the device without navigating away from the app. */
export async function downloadPhoto(photo: ShareablePhoto): Promise<void> {
  const file = await loadFile(photo);
  saveBlob(file, photo.filename);
}

type ShareOutcome = "shared" | "cancelled" | "needs-tap";

async function shareFiles(files: File[], title: string): Promise<ShareOutcome> {
  try {
    await navigator.share({ files, title });
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    // NotAllowedError: the tap "expired" before the share sheet could open.
    if (error instanceof DOMException && error.name === "NotAllowedError") return "needs-tap";
    throw error;
  }
}

/** Shares chunk `index`, then offers a tap-to-continue button for the next one. */
async function shareChunks(
  chunks: File[][],
  index: number,
  title: string,
): Promise<"shared" | "cancelled" | "pending"> {
  const outcome = await shareFiles(chunks[index], title);
  if (outcome === "cancelled") return "cancelled";
  if (outcome === "needs-tap") {
    offerTap("Photos ready", "Share now", chunks, index, title);
    return "pending";
  }
  if (index + 1 < chunks.length) {
    offerTap(
      `Shared part ${index + 1} of ${chunks.length}`,
      `Share part ${index + 2}`,
      chunks,
      index + 1,
      title,
    );
    return "pending";
  }
  return "shared";
}

/** A fresh tap on the toast button gives the browser the user activation it needs. */
function offerTap(message: string, label: string, chunks: File[][], index: number, title: string) {
  toast(message, {
    duration: Infinity,
    action: {
      label,
      onClick: () => {
        shareChunks(chunks, index, title).catch(() => toast.error("Couldn't share those photos"));
      },
    },
  });
}

/**
 * Shares product photos through the phone's native share sheet (WhatsApp,
 * Instagram, Telegram, Email, …) via the Web Share API — any number of
 * photos. Call `prefetchPhotos` beforehand so the share sheet opens straight
 * from the tap. Browsers without file sharing (most desktops) get downloads.
 */
export async function sharePhotos(
  photos: ShareablePhoto[],
  title = "Jogger Footwear",
): Promise<"shared" | "downloaded" | "cancelled" | "pending"> {
  if (photos.length === 0) return "cancelled";

  if (!canUseNativeShare()) {
    await downloadPhotos(photos, title);
    return "downloaded";
  }

  // Already fetched → share immediately, while the tap still counts.
  const ready = filesIfReady(photos);
  if (ready) return shareChunks(shareableChunks(ready), 0, title);

  // Not fetched yet → fetch, then try; if the tap has expired by then, the
  // user gets a "Share now" button rather than a silent download.
  const files = await Promise.all(photos.map(loadFile));
  return shareChunks(shareableChunks(files), 0, title);
}

/** Downloads photos without leaving the app: one file directly, several as a ZIP. */
export async function downloadPhotos(photos: ShareablePhoto[], zipName: string): Promise<void> {
  if (photos.length === 1) return downloadPhoto(photos[0]);
  return downloadPhotosAsZip(photos, zipName);
}

/** Downloads a large multi-select as a single ZIP, built by the API. */
export async function downloadPhotosAsZip(photos: ShareablePhoto[], zipName: string): Promise<void> {
  const body = JSON.stringify({
    zipName,
    items: photos.map((p) => ({ url: p.url, name: p.filename })),
  });

  async function post(): Promise<Response> {
    const token = getAccessToken();
    return fetch(apiUrl("/catalogue/zip"), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
    });
  }

  let response = await post();
  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) response = await post();
  }

  if (!response.ok) {
    throw new Error("Could not build the ZIP file");
  }

  saveBlob(await response.blob(), `${zipName}.zip`);
}
