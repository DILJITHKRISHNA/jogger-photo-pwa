import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/executive/login-form";
import { getExecutiveSession } from "@/lib/auth/executive";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getExecutiveSession();
  if (session) redirect("/");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-10">
      <div className="flex w-full max-w-sm flex-col items-center">
        <BrandMark className="mb-5 size-16 shadow-lg shadow-primary/20" />
        <h1 className="text-xl font-extrabold tracking-tight">Jogger Photo Hub</h1>
        <p className="mt-1.5 text-center text-sm text-muted-foreground">
          Find. View. Share. Your footwear catalogue, always in your pocket.
        </p>

        <div className="mt-8 w-full rounded-2xl border border-border bg-card p-5 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Trouble signing in? Ask your admin for your access code.
        </p>
      </div>
    </div>
  );
}
