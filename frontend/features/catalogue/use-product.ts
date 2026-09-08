"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { ProductView } from "@/lib/types";

export function useProduct(article: string, colour: string) {
  const [product, setProduct] = useState<ProductView | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setProduct(undefined);
    apiFetch<ProductView | null>(
      `/catalogue/product?article=${encodeURIComponent(article)}&colour=${encodeURIComponent(colour)}`,
    )
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch(() => {
        if (!cancelled) setProduct(null);
      });
    return () => {
      cancelled = true;
    };
  }, [article, colour]);

  return { product, loading: product === undefined };
}
