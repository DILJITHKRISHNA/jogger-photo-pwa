"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  ImageOff,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { apiFetch, ApiError, downloadAuthenticated } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format";
import type { ImportRecord, ImportType } from "@/lib/types";

export type ExcelKind = "stock" | "scheme" | "new-model" | "master";

const ENDPOINT: Record<ExcelKind, string> = {
  stock: "/stock",
  scheme: "/scheme",
  "new-model": "/new-models",
  master: "/master",
};

const RECORD_TYPE: Record<ExcelKind, ImportType> = {
  stock: "STOCK",
  scheme: "SCHEME",
  "new-model": "NEW_MODEL",
  master: "MASTER",
};

const DELETE_INFO: Record<ExcelKind, { label: string; effect: string }> = {
  master: {
    label: "Master Excel",
    effect:
      "The master list is cleared, every photo loses its category, brand and gender, and the Brand and Gender boxes are emptied. Photos are not deleted — upload a corrected Master Excel to categorise them again.",
  },
  stock: {
    label: "Today's Stock",
    effect: "Today's Stock will be empty for executives until you upload a new stock Excel.",
  },
  scheme: {
    label: "Scheme list",
    effect: "Scheme Articles will be empty for executives until you upload a new scheme Excel.",
  },
  "new-model": {
    label: "New Model list",
    effect: "New Model will be empty for executives until you upload a new New Model Excel.",
  },
};

export function ExcelUploadPanel({
  type,
  title,
  columnsHint,
  replaceSemantics,
}: {
  type: ExcelKind;
  title: string;
  columnsHint: string;
  replaceSemantics: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [lastRecord, setLastRecord] = useState<ImportRecord | null>(null);
  const [history, setHistory] = useState<ImportRecord[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch<ImportRecord[]>(`/imports?type=${RECORD_TYPE[type]}`)
      .then((data) => setHistory(data.slice(0, 5)))
      .catch(() => undefined);
  }, [type]);

  function pickFile(list: FileList | File[] | null) {
    const picked = list ? Array.from(list)[0] : null;
    if (picked) setFile(picked);
  }

  async function handleDownloadTemplate() {
    setDownloadingTemplate(true);
    try {
      await downloadAuthenticated(`${ENDPOINT[type]}/template`, `${type}-template.xlsx`);
      toast.success("Template downloaded — fill it in, then import it below");
    } catch {
      toast.error("Couldn't download the template");
    } finally {
      setDownloadingTemplate(false);
    }
  }

  async function handleUpload() {
    if (!file) {
      toast.error("Choose an Excel file first");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const data = await apiFetch<ImportRecord>(`${ENDPOINT[type]}/upload`, {
        method: "POST",
        body: formData,
      });

      setLastRecord(data);
      setHistory((prev) => [data, ...prev].slice(0, 5));
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";

      if (data.errorCount === 0) {
        toast.success(`Imported ${data.success} row(s)`);
      } else {
        toast.warning(`Imported ${data.success}, ${data.errorCount} row(s) had errors`);
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Import failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiFetch(ENDPOINT[type], { method: "DELETE" });
      setLastRecord(null);
      setConfirmDelete(false);
      toast.success(`${DELETE_INFO[type].label} deleted`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't delete");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownloadErrors(record: ImportRecord) {
    try {
      await downloadAuthenticated(
        `/imports/${record.id}/errors`,
        `${type}-import-errors-${record.id}.csv`,
      );
    } catch {
      toast.error("Couldn't download the error report");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">{title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Columns: {columnsHint}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{replaceSemantics}</p>
          </div>
          <Button variant="outline" disabled={downloadingTemplate} onClick={handleDownloadTemplate}>
            {downloadingTemplate ? <Loader2 className="animate-spin" /> : <Download />}
            Download template
          </Button>
        </div>
        <p className="mt-3 rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Download the Excel template, enter one row per Article + Colour, then import that file
          here. Sample rows in the file are examples — replace them with your real data.
        </p>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pickFile(e.dataTransfer.files);
          }}
          className={cn(
            "mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
          )}
        >
          <FileSpreadsheet className="size-7 text-muted-foreground" />
          <p className="text-sm font-semibold">
            {file ? file.name : "Drop the Excel file here or tap to browse"}
          </p>
          <p className="text-xs text-muted-foreground">.xlsx, .xls or .csv</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => pickFile(e.target.files)}
          />
        </label>

        <Button className="mt-4 w-full sm:w-auto" disabled={uploading || !file} onClick={handleUpload}>
          {uploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
          Import
        </Button>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Uploaded the wrong file? Remove the data it added.
          </p>
          <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 /> Delete uploaded data
          </Button>
        </div>

        {lastRecord && (
          <div className="mt-4 flex flex-col gap-3">
            <Alert variant={lastRecord.errorCount > 0 ? "warning" : "success"}>
              {lastRecord.errorCount > 0 ? <AlertTriangle /> : <CheckCircle2 />}
              <AlertTitle>
                {lastRecord.success} of {lastRecord.total} row(s) imported
                {lastRecord.errorCount > 0 ? `, ${lastRecord.errorCount} skipped` : ""}
              </AlertTitle>
              {lastRecord.errorCount > 0 && (
                <AlertDescription className="flex flex-col gap-2">
                  <ul className="list-disc pl-4">
                    {lastRecord.errors.slice(0, 8).map((e, i) => (
                      <li key={i}>
                        Row {e.row}: {e.message}
                      </li>
                    ))}
                  </ul>
                  {lastRecord.errors.length > 8 && <p>+{lastRecord.errors.length - 8} more</p>}
                  <button
                    type="button"
                    className="w-fit text-xs font-semibold text-primary underline"
                    onClick={() => handleDownloadErrors(lastRecord)}
                  >
                    Download full error report (CSV)
                  </button>
                </AlertDescription>
              )}
            </Alert>

            {lastRecord.missingPhotos.length > 0 && (
              <Alert variant="warning">
                <ImageOff />
                <AlertTitle>{lastRecord.missingPhotos.length} article(s) have no photo yet</AlertTitle>
                <AlertDescription>
                  <p className="mb-1">
                    These won&apos;t appear for executives until a matching photo is uploaded:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {lastRecord.missingPhotos.slice(0, 20).map((key) => (
                      <Badge key={key} variant="secondary">
                        {key}
                      </Badge>
                    ))}
                    {lastRecord.missingPhotos.length > 20 && (
                      <Badge variant="secondary">+{lastRecord.missingPhotos.length - 20} more</Badge>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold">Recent uploads</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {history.length === 0 ? (
            <p className="p-5 text-center text-sm text-muted-foreground">No uploads yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {history.map((record) => (
                <li key={record.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{record.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(record.uploadedAt)}
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

      <Dialog open={confirmDelete} onOpenChange={(open) => !deleting && setConfirmDelete(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete the uploaded {DELETE_INFO[type].label}?</DialogTitle>
            <DialogDescription>{DELETE_INFO[type].effect}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
