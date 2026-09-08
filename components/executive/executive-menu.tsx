"use client";

import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ExecutiveMenu({ name, employeeId }: { name: string; employeeId: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/exec/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  }

  const initial = name.trim().charAt(0).toUpperCase() || "E";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full font-bold"
            aria-label="Account"
          />
        }
      >
        {initial}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{name}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                ID: {employeeId}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
