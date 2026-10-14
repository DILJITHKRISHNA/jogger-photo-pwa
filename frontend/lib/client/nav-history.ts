"use client";

/*
 * In-app page history. The header's back arrow always goes to the page's
 * parent (breadcrumb-style); when that parent is also the page the user just
 * came from, it steps back through history instead, so the parent keeps its
 * scroll position. Only pages visited inside this tab session count.
 */
const stack: string[] = [];

/** Called on every in-app route change. */
export function recordNavigation(path: string): void {
  if (stack[stack.length - 1] === path) return;
  // Landing on the page before the current one means the user went back.
  if (stack[stack.length - 2] === path) {
    stack.pop();
    return;
  }
  stack.push(path);
}

/** Same page, ignoring how its URL happens to be encoded (`%20` vs `+`, param order). */
function samePage(a: string, b: string): boolean {
  const ua = new URL(a, "http://x");
  const ub = new URL(b, "http://x");
  ua.searchParams.sort();
  ub.searchParams.sort();
  return (
    decodeURIComponent(ua.pathname) === decodeURIComponent(ub.pathname) &&
    ua.searchParams.toString() === ub.searchParams.toString()
  );
}

/** True when `path` is the in-app page the user was on just before this one. */
export function cameFrom(path: string): boolean {
  const previous = stack[stack.length - 2];
  return previous !== undefined && samePage(previous, path);
}

/**
 * Validates a `?from=` return path: only an in-app path is accepted (never
 * another site), otherwise `fallback`.
 */
export function safeReturnPath(from: string | null, fallback: string): string {
  if (!from || !from.startsWith("/") || from.startsWith("//")) return fallback;
  return from;
}
