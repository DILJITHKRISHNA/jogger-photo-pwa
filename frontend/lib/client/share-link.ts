"use client";

import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";

interface CreatedShareLink {
  token: string;
  count: number;
  expiresAt: string;
}

/*
 * "Share as link": instead of the photos themselves (10 per share on
 * Android), the executive sends one link to a page showing every selected
 * photo — 200 photos in one message. The page is public (no sign-in) and
 * expires after 7 days.
 */
export async function createShareLink(productIds: string[]): Promise<{ url: string; count: number }> {
  const link = await apiFetch<CreatedShareLink>("/share-links", {
    method: "POST",
    body: { productIds },
  });
  return { url: `${window.location.origin}/s/${link.token}`, count: link.count };
}

function linkMessage(url: string, count: number): string {
  return `Jogger Footwear — ${count} photo${count === 1 ? "" : "s"}\n${url}`;
}

async function copyLink(url: string, count: number): Promise<"copied"> {
  try {
    await navigator.clipboard.writeText(linkMessage(url, count));
    toast.success("Link copied — paste it into WhatsApp or any chat");
  } catch {
    toast.message("Copy this link", { description: url, duration: 30_000 });
  }
  return "copied";
}

/**
 * Opens the share sheet with the link. Creating the link takes a moment after
 * the tap, so if the browser no longer counts it as "just tapped" the sheet is
 * refused — then a "Send link" button gives the user a fresh tap.
 */
export async function sendShareLink(
  url: string,
  count: number,
): Promise<"shared" | "copied" | "cancelled" | "pending"> {
  if (typeof navigator.share !== "function") return copyLink(url, count);

  try {
    // Text only (the URL inside it): every app — WhatsApp, Telegram, SMS,
    // email — sends text, and WhatsApp shows the link with a preview.
    await navigator.share({ text: linkMessage(url, count) });
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      toast("Link ready", {
        description: `${count} photo${count === 1 ? "" : "s"}`,
        duration: Infinity,
        action: { label: "Send link", onClick: () => void sendShareLink(url, count) },
        cancel: { label: "Copy", onClick: () => void copyLink(url, count) },
      });
      return "pending";
    }
    return copyLink(url, count);
  }
}
