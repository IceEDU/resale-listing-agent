import Link from "next/link";
import JobRunButton from "@/components/JobRunButton";
import { listAuditResults } from "@/lib/store";
import type { AuditSeverity } from "@/lib/types";

export const dynamic = "force-dynamic";

const SEVERITY_META: Record<AuditSeverity, { label: string; classes: string }> = {
  error: { label: "Error", classes: "bg-red-400/10 text-red-300" },
  warning: { label: "Warning", classes: "bg-amber-400/10 text-amber-300" },
  info: { label: "Info", classes: "bg-zinc-400/10 text-zinc-300" },
};

export default async function AuditPage() {
  const results = await listAuditResults(100);
  const unresolved = results.filter((r) => !r.resolved);
  const order: AuditSeverity[] = ["error", "warning", "info"];
  const sorted = [...unresolved].sort(
    (a, b) => order.indexOf(a.severity) - order.indexOf(b.severity),
  );

  return (
    <div className="space-y-5">
      <Link href="/more" className="text-sm text-zinc-500">
        ← More
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Self-check</h1>
        <p className="mt-1 text-sm text-zinc-500">
          The app audits its own data: honest connector status, price floors, consent
          records, and listing consistency.
        </p>
      </div>

      <JobRunButton job="self-audit" label="Run self-check now" variant="primary" />

      {sorted.length === 0 ? (
        <div className="card text-center text-sm text-zinc-500">
          No open findings. Run a check to verify the current state.
        </div>
      ) : (
        <section className="space-y-2">
          <h2 className="section-label">
            Open findings ({sorted.length})
          </h2>
          {sorted.map((r) => (
            <div key={r.id} className="card p-3.5">
              <div className="flex items-start justify-between gap-2">
                <span className={`chip shrink-0 ${SEVERITY_META[r.severity].classes}`}>
                  {SEVERITY_META[r.severity].label}
                </span>
                <span className="text-[11px] text-zinc-600">{r.area}</span>
              </div>
              <p className="mt-2 text-sm leading-snug text-zinc-300">{r.message}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
