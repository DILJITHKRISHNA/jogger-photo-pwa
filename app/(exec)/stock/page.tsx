import type { Metadata } from "next";

import { AppHeader } from "@/components/executive/app-header";
import { ProductGallery } from "@/components/executive/product-gallery";
import { requireExecutiveSession } from "@/lib/auth/executive";
import { getStockGallery } from "@/lib/db/repository";

export const metadata: Metadata = { title: "Today's Stock" };
export const dynamic = "force-dynamic";

function formatUpdated(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function StockPage() {
  const session = await requireExecutiveSession();
  const { items, stockDate } = await getStockGallery();
  const updated = formatUpdated(stockDate);

  return (
    <>
      <AppHeader title="Today's Stock" backHref="/" session={session} />
      {updated && (
        <p className="border-b border-border bg-muted/50 px-4 py-2 text-center text-[11px] font-medium text-muted-foreground">
          Stock list updated {updated}
        </p>
      )}
      <ProductGallery
        items={items}
        zipName="Todays-Stock"
        groupByCategory
        emptyTitle="No stock uploaded yet"
        emptyHint="Ask your admin to upload today's stock Excel."
      />
    </>
  );
}
