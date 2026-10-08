"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { Category, ProductView } from "@/lib/types";

export const UNCATEGORISED_SLUG = "uncategorised";

export function stockItemsForCategory(items: ProductView[], slug: string): ProductView[] {
  if (slug === UNCATEGORISED_SLUG) {
    return items.filter((item) => !item.categorySlug);
  }
  return items.filter((item) => item.categorySlug === slug);
}

/** Categories that have at least one Today's Stock photo, in catalogue sort order. */
export function stockCategoriesFromItems(
  items: ProductView[],
  categories: Category[],
): { slug: string; name: string; count: number }[] {
  const counts = new Map<string, { name: string; count: number }>();
  for (const item of items) {
    const slug = item.categorySlug ?? UNCATEGORISED_SLUG;
    const name = item.category ?? "Uncategorised";
    const prev = counts.get(slug);
    if (prev) prev.count += 1;
    else counts.set(slug, { name, count: 1 });
  }

  const ordered: { slug: string; name: string; count: number }[] = [];
  const seen = new Set<string>();
  for (const category of categories) {
    const found = counts.get(category.slug);
    if (!found) continue;
    ordered.push({ slug: category.slug, name: category.name, count: found.count });
    seen.add(category.slug);
  }
  for (const [slug, data] of counts) {
    if (seen.has(slug) || slug === UNCATEGORISED_SLUG) continue;
    ordered.push({ slug, name: data.name, count: data.count });
  }
  const uncategorised = counts.get(UNCATEGORISED_SLUG);
  if (uncategorised) {
    ordered.push({ slug: UNCATEGORISED_SLUG, name: uncategorised.name, count: uncategorised.count });
  }
  return ordered;
}

/** URL segment for "every photo in this category", whatever its size. */
export const ALL_SIZES_SLUG = "all";
/** URL segment for photos in this category with no Size in the Stock Excel. */
export const NO_SIZE_SLUG = "other";

export interface SizeGroup {
  slug: string;
  label: string;
  count: number;
}

function compareSizes(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/**
 * The size boxes shown inside a category: one per size found in its photos
 * (a photo with several sizes counts in each), plus "Other" for photos with
 * no size. Empty when no photo in the category has a size — callers then
 * show the photos straight away.
 */
export function sizeGroupsFromItems(items: ProductView[]): SizeGroup[] {
  const counts = new Map<string, number>();
  let noSize = 0;
  for (const item of items) {
    if (item.sizes.length === 0) noSize += 1;
    for (const size of item.sizes) counts.set(size, (counts.get(size) ?? 0) + 1);
  }
  if (counts.size === 0) return [];

  const groups: SizeGroup[] = [...counts.entries()]
    .sort(([a], [b]) => compareSizes(a, b))
    .map(([size, count]) => ({ slug: size, label: size, count }));
  if (noSize > 0) groups.push({ slug: NO_SIZE_SLUG, label: "Other", count: noSize });
  return groups;
}

export function itemsForSize(items: ProductView[], sizeSlug: string): ProductView[] {
  if (sizeSlug === ALL_SIZES_SLUG) return items;
  if (sizeSlug === NO_SIZE_SLUG) return items.filter((item) => item.sizes.length === 0);
  return items.filter((item) => item.sizes.includes(sizeSlug));
}

export function sizeLabel(sizeSlug: string): string {
  if (sizeSlug === ALL_SIZES_SLUG) return "All sizes";
  if (sizeSlug === NO_SIZE_SLUG) return "Other";
  return sizeSlug;
}

/** Route params arrive URL-encoded for anything beyond plain letters/digits. */
export function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Generic loader for any catalogue endpoint that returns ProductView[]. */
export function useGallery(path: string | null) {
  const [items, setItems] = useState<ProductView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiFetch<ProductView[]>(path)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return { items, loading };
}

export function useStockGallery() {
  const [items, setItems] = useState<ProductView[]>([]);
  const [stockDate, setStockDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ items: ProductView[]; stockDate: string | null }>("/catalogue/stock")
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setStockDate(data.stockDate);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, stockDate, loading };
}
