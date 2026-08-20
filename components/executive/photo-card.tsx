"use client";

import Link from "next/link";
import { Check, ImageOff } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { ProductView } from "@/types/product";

export function PhotoCard({
  item,
  selectMode,
  selected,
  onToggle,
}: {
  item: ProductView;
  selectMode: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const [errored, setErrored] = useState(false);

  const content = (
    <>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
        {errored ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <ImageOff className="size-6" />
            <span className="text-[10px] font-medium">No photo</span>
          </div>
        ) : (
          // Photos are user-uploaded (local disk or Supabase Storage) — a plain
          // <img> avoids next/image's remote-domain allowlist for arbitrary
          // Supabase project URLs while staying lazy-loaded for performance.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photoUrl}
            alt={`${item.article} ${item.colour}`}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setErrored(true)}
          />
        )}

        {selectMode && (
          <span
            className={cn(
              "absolute top-2 left-2 flex size-6 items-center justify-center rounded-full border-2 shadow-sm transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-white/80 bg-black/20 backdrop-blur-sm"
            )}
          >
            {selected && <Check className="size-3.5" strokeWidth={3} />}
          </span>
        )}
      </div>
      <div className="mt-1.5 px-0.5">
        <p className="truncate text-[13px] font-bold leading-tight">{item.article}</p>
        <p className="truncate text-[11px] text-muted-foreground">{item.colour}</p>
      </div>
    </>
  );

  if (selectMode) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "block w-full rounded-xl text-left transition-transform active:scale-[0.97]",
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={`/product/${encodeURIComponent(item.article)}/${encodeURIComponent(item.colour)}`}
      className="block w-full rounded-xl text-left transition-transform active:scale-[0.97]"
    >
      {content}
    </Link>
  );
}
