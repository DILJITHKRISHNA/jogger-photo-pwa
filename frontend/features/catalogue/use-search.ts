"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { ProductView } from "@/lib/types";

/** Runs a full article search for `query` (exact — whole article or whole number/text part). */
export function useArticleSearch(query: string) {
  const [results, setResults] = useState<ProductView[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    apiFetch<ProductView[]>(`/catalogue/search?article=${encodeURIComponent(trimmed)}`)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  return { results, loading };
}

/** Debounced typeahead — article suggestions for whatever is being typed. */
export function useArticleSuggestions(text: string, enabled = true) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const trimmed = text.trim();
    if (!enabled || !trimmed) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      apiFetch<string[]>(`/catalogue/suggest?q=${encodeURIComponent(trimmed)}`)
        .then((data) => {
          if (!cancelled) setSuggestions(data);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        });
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, enabled]);

  return suggestions;
}
