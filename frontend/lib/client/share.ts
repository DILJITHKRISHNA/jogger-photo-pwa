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
 * after a tap ("user activation"). Fetching photos *after* the tap takes too
 * long and the share is refused — so each batch is fetched ahead of time and
 * cached here, letting the Share tap call navigator.share() immediately.
 * Only the next batch is held in memory, so hundreds of photos stay cheap.
 */
const fileCache = new Map<string, Promise<File>>();
const readyFiles = new Map<string, File>();

function cacheKey(photo: ShareablePhoto): string {
  return `${resolveMediaUrl(photo.url)}|${photo.filename}`;
}

/*
 * What gets shared is a small, standard JPEG (max ~1280 px, typically
 * 150–300 KB), never the full-size original: big files blow past the
 * browser's 50 MB share limit, exhaust phone memory and send slowly, and
 * JPEG is the one format WhatsApp, Telegram, Instagram, email, … all accept
 * as a normal photo (WebP, for instance, can arrive as a sticker).
 */
const SHARE_MAX_EDGE_PX = 1280;
const SHARE_JPEG_QUALITY = 0.8;
/** JPEGs at or under this size are shared as they are. */
const SMALL_ENOUGH_BYTES = 700 * 1024;
/** Photos fetched + compressed at once — keeps a 100-photo batch light on phones. */
const MAX_CONCURRENT_LOADS = 4;

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

/** Stored-on-server photos have a share-sized copy on the API; others (e.g. Supabase) don't. */
function serverShareCopyUrl(url: string): string | null {
  const match = /^\/uploads\/products\/([^/?#]+)/.exec(url);
  return match ? apiUrl(`/catalogue/share-photo/${encodeURIComponent(match[1])}`) : null;
}

async function fetchAuthenticated(url: string): Promise<Response> {
  const get = () => {
    const token = getAccessToken();
    return fetch(url, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };
  let response = await get();
  if (response.status === 401 && (await refreshSession())) response = await get();
  return response;
}

async function fetchShareSource(photo: ShareablePhoto): Promise<Blob> {
  const copyUrl = serverShareCopyUrl(photo.url);
  if (copyUrl) {
    const response = await fetchAuthenticated(copyUrl).catch(() => null);
    if (response?.ok) return response.blob();
  }
  // No server copy (older API, or a photo stored elsewhere) — use the original.
  const response = await fetch(resolveMediaUrl(photo.url));
  if (!response.ok) throw new Error(`Could not load ${photo.filename}`);
  return response.blob();
}

/** Re-encodes any image as a JPEG of at most ~1280 px, decoding at reduced size to spare memory. */
async function compressToJpeg(blob: Blob): Promise<Blob> {
  const decode = (options: ImageBitmapOptions) =>
    createImageBitmap(blob, { imageOrientation: "from-image", resizeQuality: "high", ...options });

  let bitmap = await decode({ resizeWidth: SHARE_MAX_EDGE_PX });
  if (bitmap.height > SHARE_MAX_EDGE_PX * 1.25) {
    bitmap.close(); // portrait photo — cap the height instead
    bitmap = await decode({ resizeHeight: SHARE_MAX_EDGE_PX });
  }

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#ffffff"; // transparent PNGs → white, not black
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  const jpeg = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", SHARE_JPEG_QUALITY),
  );
  canvas.width = canvas.height = 0; // release canvas memory
  if (!jpeg) throw new Error("Could not compress photo");
  return jpeg;
}

function jpegName(filename: string): string {
  return `${filename.replace(/\.[^.]+$/, "")}.jpg`;
}

async function fetchShareFile(photo: ShareablePhoto): Promise<File> {
  return withLoadSlot(async () => {
    const source = await fetchShareSource(photo);
    let jpeg = source;
    if (source.type !== "image/jpeg" || source.size > SMALL_ENOUGH_BYTES) {
      jpeg = await compressToJpeg(source).catch(() => source);
    }
    return new File([jpeg], jpegName(photo.filename), { type: "image/jpeg" });
  });
}

function loadFile(photo: ShareablePhoto): Promise<File> {
  const key = cacheKey(photo);
  let pending = fileCache.get(key);
  if (!pending) {
    pending = fetchShareFile(photo).then(
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

function releaseFiles(photos: ShareablePhoto[]): void {
  for (const photo of photos) {
    const key = cacheKey(photo);
    fileCache.delete(key);
    readyFiles.delete(key);
  }
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

/** Whether this browser can share files at all — probed with one tiny file, never a real batch. */
function canShareFiles(): boolean {
  if (!canUseNativeShare()) return false;
  if (typeof navigator.canShare !== "function") return true;
  return navigator.canShare({ files: [new File([""], "photo.jpg", { type: "image/jpeg" })] });
}

/*
 * Batch sizes. Chrome's engine (Chrome, Edge, Samsung Internet — on Android
 * and desktop) shares at most 10 files / 50 MB at once and logs "Share too
 * large" for anything more, so it's never asked for more. Elsewhere (iPhone)
 * there's no file cap, but WhatsApp leaves the share sheet above 100 photos.
 */
const CHROMIUM_MAX_FILES = 10;
const WHATSAPP_MAX_FILES = 100;
const MAX_BYTES_PER_SHARE = 45 * 1024 * 1024;

function isChromiumEngine(): boolean {
  const ua = navigator.userAgent;
  // Chrome/Edge/Firefox on iOS run on Safari's engine — no 10-file cap there.
  return /Chrome\/|Chromium\//.test(ua) && !/CriOS|EdgiOS|FxiOS/.test(ua);
}

function photosPerShare(): number {
  return isChromiumEngine() ? CHROMIUM_MAX_FILES : WHATSAPP_MAX_FILES;
}

function batchesOf(photos: ShareablePhoto[]): ShareablePhoto[][] {
  const size = photosPerShare();
  const batches: ShareablePhoto[][] = [];
  for (let i = 0; i < photos.length; i += size) batches.push(photos.slice(i, i + size));
  return batches;
}

/** Fetch the first batch in the background so the Share tap opens the sheet instantly. */
export function prefetchPhotos(photos: ShareablePhoto[]): void {
  for (const photo of photos.slice(0, photosPerShare())) loadFile(photo).catch(() => undefined);
}

/** Split a batch further if its photos add up to more than one share can carry. */
function splitBySize(batch: ShareablePhoto[], files: File[]): ShareablePhoto[][] {
  const parts: ShareablePhoto[][] = [];
  let current: ShareablePhoto[] = [];
  let bytes = 0;
  files.forEach((file, i) => {
    if (current.length > 0 && bytes + file.size > MAX_BYTES_PER_SHARE) {
      parts.push(current);
      current = [];
      bytes = 0;
    }
    current.push(batch[i]);
    bytes += file.size;
  });
  if (current.length > 0) parts.push(current);
  return parts;
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

/** Saves one photo, full quality, to the device without navigating away from the app. */
export async function downloadPhoto(photo: ShareablePhoto): Promise<void> {
  const response = await fetch(resolveMediaUrl(photo.url));
  if (!response.ok) throw new Error(`Could not load ${photo.filename}`);
  saveBlob(await response.blob(), photo.filename);
}

type ShareOutcome = "shared" | "cancelled" | "needs-tap";

async function shareFiles(files: File[]): Promise<ShareOutcome> {
  try {
    // Files only: adding a title/text makes some apps (e.g. Instagram) drop
    // out of the share sheet, or send the text instead of the photos.
    await navigator.share({ files });
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    // NotAllowedError: the tap "expired" before the share sheet could open.
    if (error instanceof DOMException && error.name === "NotAllowedError") return "needs-tap";
    throw error;
  }
}

/** Shares batch `index`, then offers a tap-to-continue button for the next one. */
async function shareBatch(
  batches: ShareablePhoto[][],
  index: number,
  title: string,
): Promise<"shared" | "cancelled" | "pending"> {
  let files = filesIfReady(batches[index]) ?? (await Promise.all(batches[index].map(loadFile)));

  // Safety net for a browser with a file cap we didn't recognise: fall back to
  // Chrome-sized batches. (Never runs on Chrome, so no "Share too large" log.)
  if (
    files.length > CHROMIUM_MAX_FILES &&
    typeof navigator.canShare === "function" &&
    !navigator.canShare({ files })
  ) {
    const smaller: ShareablePhoto[][] = [];
    for (let i = 0; i < batches[index].length; i += CHROMIUM_MAX_FILES) {
      smaller.push(batches[index].slice(i, i + CHROMIUM_MAX_FILES));
    }
    batches.splice(index, 1, ...smaller);
    files = files.slice(0, CHROMIUM_MAX_FILES);
  }

  const parts = splitBySize(batches[index], files);
  if (parts.length > 1) {
    batches.splice(index, 1, ...parts);
    files = files.slice(0, parts[0].length);
  }

  // While the share sheet is open, fetch the next batch so "Share next" is instant.
  if (index + 1 < batches.length) prefetchBatch(batches[index + 1]);

  const outcome = await shareFiles(files);
  if (outcome === "cancelled") {
    // Share sheet closed without sending — in a multi-batch share, keep the
    // run going instead of losing the remaining photos.
    if (batches.length > 1) {
      const sent = batches.slice(0, index).reduce((sum, batch) => sum + batch.length, 0);
      const total = batches.reduce((sum, batch) => sum + batch.length, 0);
      offerTap(
        `Not sent — ${sent} of ${total} photos shared so far`,
        `Share these ${batches[index].length} again`,
        batches,
        index,
        title,
      );
      return "pending";
    }
    return "cancelled";
  }
  if (outcome === "needs-tap") {
    offerTap("Photos ready", "Share now", batches, index, title);
    return "pending";
  }

  releaseFiles(batches[index]); // sent — free the memory
  if (index + 1 < batches.length) {
    const total = batches.reduce((sum, batch) => sum + batch.length, 0);
    const sent = batches.slice(0, index + 1).reduce((sum, batch) => sum + batch.length, 0);
    offerTap(
      `Sent ${sent} of ${total} photos`,
      `Share next ${batches[index + 1].length}`,
      batches,
      index + 1,
      title,
    );
    return "pending";
  }
  if (batches.length > 1) {
    const total = batches.reduce((sum, batch) => sum + batch.length, 0);
    toast.success(`All ${total} photos shared`);
  }
  return "shared";
}

function prefetchBatch(batch: ShareablePhoto[]): void {
  for (const photo of batch) loadFile(photo).catch(() => undefined);
}

/** A fresh tap on the toast button gives the browser the user activation it needs. */
function offerTap(
  message: string,
  label: string,
  batches: ShareablePhoto[][],
  index: number,
  title: string,
) {
  toast(message, {
    duration: Infinity,
    action: {
      label,
      onClick: () => {
        shareBatch(batches, index, title).catch(() => toast.error("Couldn't share those photos"));
      },
    },
  });
}

/**
 * Shares product photos through the phone's native share sheet (WhatsApp,
 * Instagram, Telegram, Email, …) via the Web Share API — any number of
 * photos, in batches the browser and WhatsApp accept (10 on Chrome, 100
 * elsewhere), one tap per batch. Call `prefetchPhotos` beforehand so the
 * share sheet opens straight from the tap. Browsers without file sharing
 * (most desktops) get downloads.
 */
export async function sharePhotos(
  photos: ShareablePhoto[],
  title = "Jogger Footwear",
): Promise<"shared" | "downloaded" | "cancelled" | "pending"> {
  if (photos.length === 0) return "cancelled";

  if (!canShareFiles()) {
    await downloadPhotos(photos, title);
    return "downloaded";
  }

  return shareBatch(batchesOf(photos), 0, title);
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
