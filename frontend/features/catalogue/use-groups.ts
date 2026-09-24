"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { GroupSummary } from "@/lib/types";

export type GroupKind = "brands" | "genders";

/** Brands or genders (with photo counts) for the executive Brand / Gender boxes. */
export function useGroups(kind: GroupKind) {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<GroupSummary[]>(`/catalogue/${kind}`)
      .then((data) => {
        if (!cancelled) setGroups(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  return { groups, loading, error };
}
