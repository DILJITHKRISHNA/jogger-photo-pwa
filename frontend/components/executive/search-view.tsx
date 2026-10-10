"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ImageOff } from "lucide-react";

import { ArticleSearchBox } from "@/components/executive/article-search-box";
import { resolveMediaUrl } from "@/lib/api-client";
import { useArticleSearch } from "@/features/catalogue/use-search";
import type { ProductView } from "@/lib/types";

export function SearchView({ initialArticle }: { initialArticle: string }) {
  const [text, setText] = useState(initialArticle);
  const [submitted, setSubmitted] = useState(initialArticle);
  const { results, loading } = useArticleSearch(submitted);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Editing the text after a search clears the stale results rather than leaving them on screen.
  const query = text.trim() === submitted.trim() ? submitted : "";

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
        <ArticleSearchBox
          ref={inputRef}
          value={text}
          onChange={setText}
          onSubmit={(value) => setSubmitted(value.trim())}
          placeholder="Search article, e.g. SS5205 or 5205"
          showClear
        />
      </div>

      <div className="flex-1 px-4 py-4">
        {!text.trim() && (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            Type an article number or text to see suggestions, then pick one to see its photos.
          </p>
        )}

        {text.trim() && !query && (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            Pick a suggestion or press Enter to search.
          </p>
        )}

        {query && loading && (
          <p className="pt-10 text-center text-sm text-muted-foreground">Searching…</p>
        )}

        {query && !loading && results && results.length === 0 && (
          <div className="flex flex-col items-center gap-2 pt-10 text-center">
            <ImageOff className="size-8 text-muted-foreground" />
            <p className="text-sm font-semibold">No photos found for &ldquo;{query}&rdquo;</p>
            <p className="text-xs text-muted-foreground">Check the article number and try again.</p>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {(query ? grouped : []).map(([article, items]) => (
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
