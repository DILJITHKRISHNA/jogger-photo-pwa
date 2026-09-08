"use client";

import { getAccessToken } from "@/lib/auth-token";
import { refreshSession, resolveMediaUrl, apiUrl } from "@/lib/api-client";

export interface ShareablePhoto {
  url: string;
  filename: string;
}

async function toFile(photo: ShareablePhoto): Promise<File> {
  const response = await fetch(resolveMediaUrl(photo.url));
  const blob = await response.blob();
  const type = blob.type || "image/jpeg";
  return new File([blob], photo.filename, { type });
}

/** Triggers a plain browser download for one file (used as the universal fallback). */
export function downloadPhoto(photo: ShareablePhoto): void {
  const link = document.createElement("a");
  link.href = resolveMediaUrl(photo.url);
  link.download = photo.filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/**
 * Shares one or more product photos through the phone's native share sheet
 * (WhatsApp, Instagram, Telegram, Email, …) via the Web Share API. Falls
 * back to plain downloads when the API or file sharing isn't supported.
 */
export async function sharePhotos(
  photos: ShareablePhoto[],
  title = "Jogger Footwear",
): Promise<"shared" | "downloaded" | "cancelled"> {
  if (photos.length === 0) return "cancelled";

  if (canUseNativeShare()) {
    try {
      const files = await Promise.all(photos.map(toFile));
      const canShareFiles = typeof navigator.canShare !== "function" || navigator.canShare({ files });

      if (canShareFiles) {
        await navigator.share({ files, title });
        return "shared";
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      // fall through to download fallback
    }
  }

  photos.forEach((photo) => downloadPhoto(photo));
  return "downloaded";
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

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${zipName}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
