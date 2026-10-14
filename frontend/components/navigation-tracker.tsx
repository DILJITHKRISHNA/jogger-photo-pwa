"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { recordNavigation } from "@/lib/client/nav-history";

/** Records each in-app page visit for the header's back arrow. */
export function NavigationTracker() {
  const pathname = usePathname();

  useEffect(() => {
    recordNavigation(window.location.pathname + window.location.search);
  }, [pathname]);

  return null;
}
