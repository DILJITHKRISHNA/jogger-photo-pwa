import Link from "next/link";
import type { Metadata } from "next";
import {
  ImagePlus,
  Layers,
  PackageCheck,
  Tag,
  Sparkles,
  FolderTree,
  AlertTriangle,
  History,
} from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatCard } from "@/components/admin/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats, listImports } from "@/lib/db/repository";
import { formatRelativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const IMPORT_TYPE_LABEL: Record<string, string> = {
  stock: "Stock Excel",
  scheme: "Scheme Excel",
  "new-model": "New Model Excel",
  photos: "Photo upload",
};

export default async function AdminDashboardPage() {
  const [stats, recentImports] = await Promise.all([
    getDashboardStats(),
    listImports(),
  ]);

  return (
    <AdminShell title="Dashboard">
      <div className="flex flex-col gap-6">
        {stats.missingStockPhotoCount > 0 && (
          <Alert variant="warning">
            <AlertTriangle />
            <AlertTitle>{stats.missingStockPhotoCount} stock item(s) are missing a photo</AlertTitle>
            <AlertDescription>
              <p>
                These articles are in the latest stock upload but have no matching product photo,
                so executives won&apos;t see them. Upload the missing photos or check{" "}
                <Link href="/admin/search" className="underline">
                  Search / Check
                </Link>
                .
              </p>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Product Photos"
            value={stats.photosCount}
            icon={ImagePlus}
            accent="bg-primary/10 text-primary"
            hint={`${stats.activeArticleCount} unique articles`}
          />
          <StatCard
            label="Today's Stock"
            value={stats.stockArticleCount}
            icon={PackageCheck}
            accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            hint={`Updated ${formatRelativeTime(stats.lastStockUpload)}`}
          />
          <StatCard
            label="Scheme Articles"
            value={stats.schemeCount}
            icon={Tag}
            accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
            hint={`Updated ${formatRelativeTime(stats.lastSchemeUpload)}`}
          />
          <StatCard
            label="New Models"
            value={stats.newModelCount}
            icon={Sparkles}
            accent="bg-amber-500/10 text-amber-600 dark:text-amber-500"
            hint={`Updated ${formatRelativeTime(stats.lastNewModelUpload)}`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Categories"
            value={stats.categoriesCount}
            icon={FolderTree}
            accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          />
          <StatCard
            label="Last Photo Update"
            value={formatRelativeTime(stats.lastPhotoUpdate)}
            icon={Layers}
            accent="bg-rose-500/10 text-rose-600 dark:text-rose-400"
          />
          <StatCard
            label="Import Errors (last 10)"
            value={stats.recentImportErrorCount}
            icon={AlertTriangle}
            accent="bg-destructive/10 text-destructive"
          />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-bold">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { href: "/admin/photos", label: "Upload Photos", icon: ImagePlus },
              { href: "/admin/upload/stock", label: "Upload Stock Excel", icon: PackageCheck },
              { href: "/admin/upload/scheme", label: "Upload Scheme Excel", icon: Tag },
              { href: "/admin/upload/new-model", label: "Upload New Model", icon: Sparkles },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 text-sm font-semibold shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
                >
                  <Icon className="size-4.5 text-primary" />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Recent imports</h2>
            <Link
              href="/admin/import-history"
              className="flex items-center gap-1 text-xs font-semibold text-primary"
            >
              <History className="size-3.5" /> View all
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {recentImports.length === 0 ? (
              <p className="p-5 text-center text-sm text-muted-foreground">
                No imports yet — upload a photo set or Excel file to get started.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentImports.slice(0, 6).map((record) => (
                  <li key={record.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{record.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {IMPORT_TYPE_LABEL[record.type]} · {formatRelativeTime(record.uploadedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge variant="secondary">{record.success} ok</Badge>
                      {record.errorCount > 0 && (
                        <Badge variant="destructive">{record.errorCount} errors</Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
