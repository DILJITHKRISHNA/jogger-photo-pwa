"use client";

/*
 * In-app page history, so the header's back arrow can return to the page the
 * user actually came from (gallery, stock size, search…) instead of a fixed
 * parent. Only pages visited inside this tab session count — when the user
 * arrived from outside (a shared link, a fresh reload), there is no previous
 * in-app page and the back arrow uses its fallback link instead of leaving
 * the app.
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

export function hasPreviousPage(): boolean {
  return stack.length > 1;
}
