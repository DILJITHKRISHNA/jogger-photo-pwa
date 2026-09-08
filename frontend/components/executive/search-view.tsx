"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Search, X, ImageOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { resolveMediaUrl } from "@/lib/api-client";
import { useArticleSearch } from "@/features/catalogue/use-search";
import type { ProductView } from "@/lib/types";

export function SearchView({ initialArticle }: { initialArticle: string }) {
  const { query, setQuery, results, loading } = useArticleSearch(initialArticle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const grouped = useMemo(() => {
    if (!results) return [];
    const byArticle = new Map<string, ProductView[]>();
    for (const item of results) {
      if (!byArticle.has(item.article)) byArticle.set(item.article, []);
      byArticle.get(item.article)!.push(item);
    }
    return Array.from(byArticle.entries());
  }, [results]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-14 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputMode="numeric"
            placeholder="Enter article number…"
            className="h-12 rounded-2xl pl-10 text-[15px]"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
            >
              <X className="size-4.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        {!query.trim() && (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            Start typing an article number to find its photos.
          </p>
        )}

        {query.trim() && loading && (
          <p className="pt-10 text-center text-sm text-muted-foreground">Searching…</p>
        )}

        {query.trim() && !loading && results && results.length === 0 && (
          <div className="flex flex-col items-center gap-2 pt-10 text-center">
            <ImageOff className="size-8 text-muted-foreground" />
            <p className="text-sm font-semibold">No photos found for &ldquo;{query}&rdquo;</p>
            <p className="text-xs text-muted-foreground">Check the article number and try again.</p>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {grouped.map(([article, items]) => (
            <div key={article}>
              <p className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Article {article} · {items.length} colour{items.length === 1 ? "" : "s"}
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/product/${encodeURIComponent(item.article)}/${encodeURIComponent(item.colour)}`}
                    className="flex flex-col gap-1.5"
                  >
                    <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveMediaUrl(item.photoUrl)}
                        alt={`${item.article} ${item.colour}`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="truncate text-center text-[11px] font-semibold">{item.colour}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
