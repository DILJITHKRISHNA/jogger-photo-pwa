"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, IdCard, UserRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/exec/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, employeeId, accessCode }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Sign-in failed");
      }
      toast.success(`Welcome, ${data.name.split(" ")[0]}!`);
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Your name</Label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="name"
            autoComplete="name"
            placeholder="e.g. Rahul Menon"
            className="pl-8"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="employeeId">Employee ID</Label>
        <div className="relative">
          <IdCard className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="employeeId"
            autoComplete="username"
            placeholder="e.g. EMP-042"
            className="pl-8"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="accessCode">Access code</Label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="accessCode"
            type="password"
            autoComplete="current-password"
            placeholder="Provided by your admin"
            className="pl-8"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            required
          />
        </div>
      </div>

      <Button type="submit" size="lg" disabled={loading} className="mt-2 h-11 text-[15px]">
        {loading && <Loader2 className="animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}
