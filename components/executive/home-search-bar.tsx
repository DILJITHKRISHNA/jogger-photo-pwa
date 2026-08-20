"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function HomeSearchBar() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function go() {
    const params = value.trim() ? `?article=${encodeURIComponent(value.trim())}` : "";
    router.push(`/search${params}`);
  }

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="numeric"
          placeholder="Search article number…"
          className="h-12 rounded-2xl border-0 bg-card pl-10 text-[15px] shadow-sm ring-1 ring-border"
        />
      </div>
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
