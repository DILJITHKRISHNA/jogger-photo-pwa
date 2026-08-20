import Link from "next/link";
import type { Metadata } from "next";
import { Images, PackageCheck, Tag, Sparkles, ChevronRight } from "lucide-react";

import { AppHeader } from "@/components/executive/app-header";
import { HomeSearchBar } from "@/components/executive/home-search-bar";
import { requireExecutiveSession } from "@/lib/auth/executive";
import {
  getNewModelGallery,
  getSchemeGallery,
  getStockGallery,
  listCategories,
} from "@/lib/db/repository";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await requireExecutiveSession();
  const [categories, stock, scheme, newModel] = await Promise.all([
    listCategories(),
    getStockGallery(),
    getSchemeGallery(),
    getNewModelGallery(),
  ]);

  const tiles = [
    {
      href: "/category",
      label: "Bulk Photos",
      subtitle: "Browse by category",
      icon: Images,
      accent: "bg-primary/10 text-primary",
    },
    {
      href: "/stock",
      label: "Today's Stock",
      subtitle: `${stock.items.length} article${stock.items.length === 1 ? "" : "s"}`,
      icon: PackageCheck,
      accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      href: "/scheme",
      label: "Scheme Articles",
      subtitle: `${scheme.length} article${scheme.length === 1 ? "" : "s"}`,
      icon: Tag,
      accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      href: "/new-model",
      label: "New Model",
      subtitle: `${newModel.length} article${newModel.length === 1 ? "" : "s"}`,
      icon: Sparkles,
      accent: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
    },
  ];

  return (
    <>
      <AppHeader title="Jogger Photo Hub" session={session} />

      <div className="flex flex-col gap-6 px-4 pt-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Hi {session.name.split(" ")[0]}, find a photo in seconds.
          </p>
          <div className="mt-2">
            <HomeSearchBar />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.href}
                href={tile.href}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-transform active:scale-[0.97]"
              >
                <span className={`flex size-10 items-center justify-center rounded-xl ${tile.accent}`}>
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-[15px] font-bold leading-tight">{tile.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{tile.subtitle}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Categories</h2>
            <Link
              href="/category"
              className="flex items-center text-xs font-semibold text-primary"
            >
              View all <ChevronRight className="size-3.5" />
            </Link>
          </div>
          {categories.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No categories yet.
            </p>
          ) : (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm active:scale-95"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
