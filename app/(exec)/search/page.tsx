import type { Metadata } from "next";

import { AppHeader } from "@/components/executive/app-header";
import { SearchView } from "@/components/executive/search-view";
import { requireExecutiveSession } from "@/lib/auth/executive";

export const metadata: Metadata = { title: "Search" };
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ article?: string }>;
}) {
  const session = await requireExecutiveSession();
  const { article } = await searchParams;

  return (
    <>
      <AppHeader title="Search" backHref="/" session={session} />
      <SearchView initialArticle={article ?? ""} />
    </>
  );
}
