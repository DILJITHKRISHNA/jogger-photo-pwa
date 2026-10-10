"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { ArticleSearchBox } from "@/components/executive/article-search-box";
import { Button } from "@/components/ui/button";

export function HomeSearchBar() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function go(text: string) {
    const trimmed = text.trim();
    const params = trimmed ? `?article=${encodeURIComponent(trimmed)}` : "";
    router.push(`/search${params}`);
  }

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        go(value);
      }}
    >
      <ArticleSearchBox
        value={value}
        onChange={setValue}
        onSubmit={go}
        placeholder="Search article"
        className="flex-1"
        inputClassName="border-0 bg-card shadow-sm ring-1 ring-border"
      />
      <Button
        type="submit"
        size="icon-lg"
        className="size-12 shrink-0 rounded-2xl"
        aria-label="Search"
      >
        <ArrowRight />
      </Button>
    </form>
  );
}
