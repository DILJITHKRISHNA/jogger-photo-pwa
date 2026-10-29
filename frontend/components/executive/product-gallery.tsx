"use client";

import { useMemo, useState } from "react";

import { PhotoCard } from "@/components/executive/photo-card";
import { SelectionToolbar } from "@/components/executive/selection-toolbar";
import type { ProductView } from "@/lib/types";

export function ProductGallery({
  items,
  emptyTitle,
  emptyHint,
  zipName,
  groupByCategory = false,
}: {
  items: ProductView[];
  emptyTitle: string;
  emptyHint?: string;
  zipName: string;
  groupByCategory?: boolean;
}) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    if (!groupByCategory) return [{ label: null as string | null, items }];
    const byCategory = new Map<string, ProductView[]>();
    for (const item of items) {
      const key = item.category ?? "Uncategorised";
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(item);
    }
    return Array.from(byCategory.entries()).map(([label, groupItems]) => ({
      label,
      items: groupItems,
    }));
  }, [items, groupByCategory]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 px-8 py-16 text-center">
        <p className="text-sm font-bold text-foreground">{emptyTitle}</p>
        {emptyHint && <p className="text-xs text-muted-foreground">{emptyHint}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <SelectionToolbar
        items={items}
        selectMode={selectMode}
        onSelectModeChange={setSelectMode}
        selected={selected}
        onSelectedChange={setSelected}
        zipName={zipName}
        className="sticky top-14 z-20 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur"
      />

      <div className="flex flex-col gap-5 px-4 py-4">
        {groups.map((group) => (
          <div key={group.label ?? "all"}>
            {group.label && (
              <h3 className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                {group.label}
              </h3>
            )}
            <div className="grid grid-cols-2 gap-3">
              {group.items.map((item) => (
                <PhotoCard
                  key={item.id}
                  item={item}
                  selectMode={selectMode}
                  selected={selected.has(item.id)}
                  onToggle={() => toggle(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
