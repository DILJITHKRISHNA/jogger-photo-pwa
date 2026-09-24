"use client";

import { Users } from "lucide-react";

import { GroupIndex } from "@/components/executive/group-index";

export default function GenderIndexPage() {
  return (
    <GroupIndex
      kind="genders"
      title="Gender"
      hint="Pick a section (Gents, Ladies, Kids…) to view and share its photos."
      emptyText="No genders yet. Ask your admin to add a Gender column to the Master Excel."
      hrefBase="/gender"
      icon={Users}
    />
  );
}
