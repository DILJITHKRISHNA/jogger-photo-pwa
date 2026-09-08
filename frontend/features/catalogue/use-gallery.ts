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
