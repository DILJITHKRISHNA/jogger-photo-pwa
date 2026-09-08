import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div>
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-extrabold tracking-tight">{value}</p>
        {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="size-4.5" />
      </span>
    </div>
  );
}
