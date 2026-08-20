import { redirect } from "next/navigation";

import { BottomNav } from "@/components/executive/bottom-nav";
import { getExecutiveSession } from "@/lib/auth/executive";

export default async function ExecutiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getExecutiveSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
