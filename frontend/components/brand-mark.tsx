import { cn } from "@/lib/utils";

/**
 * The Jogger "g" brand mark. Renders the real logo asset (public/icons/icon.svg)
 * everywhere a logo/app icon is needed in the UI, instead of a generic lucide
 * icon or letter badge standing in for the brand.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/icons/icon.svg"
      alt="Jogger"
      className={cn("shrink-0 rounded-2xl object-contain", className)}
    />
  );
}
