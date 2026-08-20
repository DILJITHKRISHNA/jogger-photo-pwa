"use client";

import { useMemo, useState } from "react";
import { Download, ImageOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format";
import type { ImportRecord, ImportType } from "@/types/product";

const TYPE_LABEL: Record<ImportType, string> = {
  stock: "Stock Excel",
  scheme: "Scheme Excel",
  "new-model": "New Model Excel",
  photos: "Photo upload",
};

const FILTERS: Array<{ value: ImportType | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "photos", label: "Photos" },
  { value: "stock", label: "Stock" },
  { value: "scheme", label: "Scheme" },
  { value: "new-model", label: "New Model" },
];

export function ImportHistoryTable({ records }: { records: ImportRecord[] }) {
  const [filter, setFilter] = useState<ImportType | "all">("all");
  const [detail, setDetail] = useState<ImportRecord | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? records : records.filter((r) => r.type === filter)),
    [records, filter]
  );

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as ImportType | "all")}>
        <TabsList className="flex-wrap">
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No imports in this view yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((record) => (
              <li key={record.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{record.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABEL[record.type]} · {formatDateTime(record.uploadedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge variant="secondary">{record.success}/{record.total} ok</Badge>
                  {record.errorCount > 0 && (
                    <Badge variant="destructive">{record.errorCount} errors</Badge>
                  )}
                  {record.missingPhotos.length > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <ImageOff className="size-3" />
                      {record.missingPhotos.length}
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setDetail(record)}>
                    Details
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{detail?.filename}</DialogTitle>
            <DialogDescription>
              {detail && `${TYPE_LABEL[detail.type]} · ${formatDateTime(detail.uploadedAt)}`}
            </DialogDescription>
          </DialogHeader>

          {detail && (
            <div className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto text-sm">
              <div className="flex gap-2">
                <Badge variant="secondary">{detail.success}/{detail.total} imported</Badge>
                {detail.errorCount > 0 && <Badge variant="destructive">{detail.errorCount} errors</Badge>}
              </div>

              {detail.errors.length > 0 && (
                <div>
                  <p className="mb-1 font-semibold">Row errors</p>
                  <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                    {detail.errors.slice(0, 30).map((e, i) => (
                      <li key={i}>
                        Row {e.row}: {e.message}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`/api/admin/import-history/${detail.id}/errors`}
                    className="mt-2 flex w-fit items-center gap-1 text-xs font-semibold text-primary underline"
                  >
                    <Download className="size-3.5" /> Download CSV
                  </a>
                </div>
              )}

              {detail.missingPhotos.length > 0 && (
                <div>
                  <p className="mb-1 font-semibold">Missing photos</p>
                  <div className="flex flex-wrap gap-1">
                    {detail.missingPhotos.map((key) => (
                      <Badge key={key} variant="secondary">
                        {key}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {detail.errors.length === 0 && detail.missingPhotos.length === 0 && (
                <p className="text-muted-foreground">Everything imported cleanly.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
