"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Search, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchJson } from "@/lib/client/fetcher";

interface CheckResult {
  article: string;
  colour: string;
  hasPhoto: boolean;
  photoUrl: string | null;
  category: string | null;
  inStock: boolean;
  inScheme: boolean;
  isNewModel: boolean;
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5">
      <span className="text-sm font-semibold">{label}</span>
      {ok ? (
        <span className="flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4" /> Yes
        </span>
      ) : (
        <span className="flex items-center gap-1 text-sm font-semibold text-muted-foreground">
          <XCircle className="size-4" /> No
        </span>
      )}
    </div>
  );
}

export function CheckPanel() {
  const [article, setArticle] = useState("");
  const [colour, setColour] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<CheckResult>(
        `/api/admin/check?article=${encodeURIComponent(article)}&colour=${encodeURIComponent(colour)}`
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="check-article">Article</Label>
          <Input
            id="check-article"
            value={article}
            onChange={(e) => setArticle(e.target.value)}
            placeholder="e.g. 1001"
            required
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="check-colour">Colour</Label>
          <Input
            id="check-colour"
            value={colour}
            onChange={(e) => setColour(e.target.value)}
            placeholder="e.g. BRWN"
            required
          />
        </div>
        <Button type="submit" disabled={loading} className="sm:mb-0.5">
          {loading ? <Loader2 className="animate-spin" /> : <Search />}
          Check
        </Button>
      </form>

      {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

      {result && (
        <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
          <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
            {result.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.photoUrl}
                alt={`${result.article} ${result.colour}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                No photo
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div>
              <p className="text-lg font-extrabold">
                {result.article} <span className="text-muted-foreground">· {result.colour}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Category: {result.category ?? "Not set"}
              </p>
            </div>
            <StatusRow label="Photo uploaded" ok={result.hasPhoto} />
            <StatusRow label="In today's stock" ok={result.inStock} />
            <StatusRow label="Scheme article" ok={result.inScheme} />
            <StatusRow label="New model" ok={result.isNewModel} />
          </div>
        </div>
      )}
    </div>
  );
}
