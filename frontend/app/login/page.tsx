"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/executive/login-form";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(user.role === "ADMIN" ? "/admin" : "/");
    }
  }, [status, user, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-10">
      <div className="flex w-full max-w-sm flex-col items-center">
        <BrandMark className="mb-5 size-16 rounded-2xl shadow-lg shadow-primary/20" />
        <h1 className="text-xl font-extrabold tracking-tight">Jogger Photo Hub</h1>
        <p className="mt-1.5 text-center text-sm text-muted-foreground">
          Find. View. Share. Your footwear catalogue, always in your pocket.
        </p>

        <div className="mt-8 w-full rounded-2xl border border-border bg-card p-5 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Trouble signing in? Ask your admin for your phone number and password.
        </p>
      </div>
    </div>
  );
}
