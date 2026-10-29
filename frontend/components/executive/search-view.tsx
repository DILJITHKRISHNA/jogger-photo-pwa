"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, ImageOff } from "lucide-react";

import { ArticleSearchBox } from "@/components/executive/article-search-box";
import { SelectionToolbar } from "@/components/executive/selection-toolbar";
import { resolveMediaUrl } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useArticleSearch } from "@/features/catalogue/use-search";
import type { ProductView } from "@/lib/types";

export function SearchView({ initialArticle }: { initialArticle: string }) {
  const [text, setText] = useState(initialArticle);
  const [submitted, setSubmitted] = useState(initialArticle);
  const { results, loading } = useArticleSearch(submitted);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  // The searched articles' photos, in the order shown — what Select → All picks.
  const shown = useMemo(() => (query ? grouped.flatMap(([, items]) => items) : []), [query, grouped]);

  function runSearch(value: string) {
    // A new search starts with nothing selected.
    setSelected(new Set());
    setSelectMode(false);
    setSubmitted(value.trim());
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** Selects every colour of one article, or clears them if all are already selected. */
  function toggleArticle(items: ProductView[]) {
    const allSelected = items.every((i) => selected.has(i.id));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const item of items) {
        if (allSelected) next.delete(item.id);
        else next.add(item.id);
      }
      return next;
    });
  }

  const backHref = `/search?${new URLSearchParams({ article: submitted })}`;

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-14 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <ArticleSearchBox
          ref={inputRef}
          value={text}
          onChange={setText}
          onSubmit={runSearch}
          placeholder="Search article"
          showClear
        />
        {shown.length > 0 && (
          <SelectionToolbar
            items={shown}
            selectMode={selectMode}
            onSelectModeChange={setSelectMode}
            selected={selected}
            onSelectedChange={setSelected}
            zipName={`Article ${submitted}`}
            className="mt-2.5"
          />
        )}
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
          {(query ? grouped : []).map(([article, items]) => {
            const allSelected = items.every((i) => selected.has(i.id));
            return (
              <div key={article}>
                <div className="mb-2 flex min-h-7 items-center justify-between gap-2">
                  <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Article {article} · {items.length} colour{items.length === 1 ? "" : "s"}
                  </p>
                  {selectMode && grouped.length > 1 && (
                    <button
                      type="button"
                      onClick={() => toggleArticle(items)}
                      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                    >
                      {allSelected ? "Clear" : "Select all"}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {items.map((item) => {
                    const photo = (
                      <>
                        <div
                          className={cn(
                            "relative aspect-square overflow-hidden rounded-xl bg-muted",
                            selectMode &&
                              selected.has(item.id) &&
                              "ring-2 ring-primary ring-offset-2 ring-offset-background",
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolveMediaUrl(item.photoUrl)}
                            alt={`${item.article} ${item.colour}`}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                          {selectMode && (
                            <span
                              className={cn(
                                "absolute top-1.5 left-1.5 flex size-5.5 items-center justify-center rounded-full border-2 shadow-sm transition-colors",
                                selected.has(item.id)
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-white/80 bg-black/20 backdrop-blur-sm",
                              )}
                            >
                              {selected.has(item.id) && <Check className="size-3" strokeWidth={3} />}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-center text-[11px] font-semibold">{item.colour}</p>
                      </>
                    );

                    return selectMode ? (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggle(item.id)}
                        className="flex flex-col gap-1.5 text-left transition-transform active:scale-[0.97]"
                      >
                        {photo}
                      </button>
                    ) : (
                      <Link
                        key={item.id}
                        href={`/product/${encodeURIComponent(item.article)}/${encodeURIComponent(item.colour)}?from=${encodeURIComponent(backHref)}`}
                        className="flex flex-col gap-1.5"
                      >
                        {photo}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
