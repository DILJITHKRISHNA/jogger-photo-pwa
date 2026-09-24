"use client";

import { Store } from "lucide-react";

import { GroupIndex } from "@/components/executive/group-index";

export default function BrandIndexPage() {
  return (
    <GroupIndex
      kind="brands"
      title="Brand"
      hint="Pick a brand to view and share all of its photos."
      emptyText="No brands yet. Ask your admin to add a Brand column to the Master Excel."
      hrefBase="/brand"
      icon={Store}
    />
  );
}
