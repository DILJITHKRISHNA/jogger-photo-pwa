"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { AppHeader } from "@/components/executive/app-header";
import { SearchView } from "@/components/executive/search-view";

function SearchPageInner() {
  const searchParams = useSearchParams();
  const article = searchParams.get("article") ?? "";

  return (
    <>
      <AppHeader title="Search" backHref="/" />
      <SearchView initialArticle={article} />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<AppHeader title="Search" backHref="/" />}>
      <SearchPageInner />
    </Suspense>
  );
}
