"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { Category } from "@/lib/types";

/** Shared by the executive Bulk Photos picker and the admin Categories screen. */
export function useCategories(includeHidden = false) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Category[]>(
        `/categories${includeHidden ? "?includeHidden=true" : ""}`,
      );
      setCategories(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load categories");
    } finally {
      setLoading(false);
    }
  }, [includeHidden]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { categories, setCategories, loading, error, refresh };
}
