"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { toast } from "sonner";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AdminNavLinks } from "@/components/admin/admin-nav-links";
import { useAuth } from "@/hooks/use-auth";

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <BrandMark className="size-9 rounded-xl" />
      <div className="leading-tight">
        <p className="text-sm font-extrabold text-sidebar-foreground">Jogger Admin</p>
        <p className="text-[11px] text-sidebar-foreground/55">Photo &amp; catalogue manager</p>
      </div>
    </div>
  );
}

function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    toast.success("Signed out");
    router.push("/admin/login");
  }

  return (
    <Button
      variant="ghost"
      className={`justify-start gap-2.5 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${className ?? ""}`}
      onClick={handleLogout}
    >
      <LogOut className="size-4.5" />
      Sign out
    </Button>
  );
}

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-sidebar-border bg-sidebar px-3 py-4 md:flex">
        <div className="flex flex-col gap-6">
          <Brand />
          <AdminNavLinks />
        </div>
        <LogoutButton />
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col">
        {/* Mobile topbar */}
        <header className="safe-top sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/95 px-3 py-2.5 backdrop-blur md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu />
          </Button>
          <h1 className="flex-1 truncate text-[15px] font-bold">{title}</h1>
        </header>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="border-sidebar-border bg-sidebar p-0">
            <SheetHeader className="border-b border-sidebar-border">
              <SheetTitle className="text-sidebar-foreground">
                <Brand />
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-1 flex-col justify-between px-3 pb-4">
              <AdminNavLinks onNavigate={() => setOpen(false)} />
              <LogoutButton className="mt-4" />
            </div>
          </SheetContent>
        </Sheet>

        <header className="hidden border-b border-border px-6 py-4 md:block">
          <h1 className="text-lg font-extrabold tracking-tight">{title}</h1>
        </header>

        <main className="flex-1 px-4 py-5 md:px-6 md:py-6">{children}</main>
      </div>
    </div>
  );
}
