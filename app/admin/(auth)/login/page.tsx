import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { BrandMark } from "@/components/brand-mark";
import { isAdminAuthenticated } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-sidebar px-6 py-10">
      <div className="flex w-full max-w-sm flex-col items-center">
        <BrandMark className="mb-5 size-16 shadow-lg shadow-primary/20" />
        <h1 className="text-xl font-extrabold tracking-tight text-sidebar-foreground">
          Jogger Admin
        </h1>
        <p className="mt-1.5 text-center text-sm text-sidebar-foreground/60">
          Photos, stock, scheme &amp; new model management.
        </p>

        <div className="mt-8 w-full rounded-2xl border border-sidebar-border bg-card p-5 shadow-lg">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
