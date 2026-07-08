import Link from "next/link";
import JobRunButton from "@/components/JobRunButton";
import { listAuditResults, listItems, listJobRuns, listRecommendations } from "@/lib/store";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  success: "bg-emerald-400/10 text-emerald-300",
  failed: "bg-red-400/10 text-red-300",
  running: "bg-amber-400/10 text-amber-300",
};

function fmt(iso?: string): string {
  if (!iso) return "never";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AutomationPage() {
  const [items, recommendations, runs, audits] = await Promise.all([
    listItems(),
    listRecommendations(),
    listJobRuns(20),
    listAuditResults(100),
  ]);

  const lastRefresh = runs.find(
    (r) => r.jobName === "refresh-recommendations" && r.status === "success",
  );
  const lastAudit = runs.find((r) => r.jobName === "self-audit" && r.status === "success");
  const pending = recommendations.filter((r) => r.status === "pending").length;
  const stale = items.filter((i) => i.status === "stale").length;
  const unresolved = audits.filter((a) => !a.resolved);
  const problems = unresolved.filter((a) => a.severity !== "info").length;
  const nextReview = items
    .flatMap((i) => i.listings.map((l) => l.nextReviewAt))
    .filter((d): d is string => !!d)
    .sort()[0];

  const stats = [
    { label: "Last refresh", value: fmt(lastRefresh?.finishedAt) },
    { label: "Last self-audit", value: fmt(lastAudit?.finishedAt) },
    { label: "Pending suggestions", value: String(pending) },
    { label: "Stale listings", value: String(stale) },
    { label: "Warnings and errors", value: String(problems), warn: problems > 0 },
    { label: "Next scheduled review", value: fmt(nextReview) },
  ];

  return (
    <div className="space-y-5">
      <Link href="/more" className="text-sm text-zinc-500">
        ← More
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Automation service</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Background jobs generate suggestions and audits only. Marketplace changes always
          wait for your approval.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="card p-3.5">
            <div className={`text-sm font-semibold ${s.warn ? "text-amber-300" : ""}`}>
              {s.value}
            </div>
            <div className="mt-0.5 text-[11px] leading-tight text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>

      <section className="space-y-2">
        <h2 className="section-label">Quick actions</h2>
        <JobRunButton job="refresh-recommendations" label="Refresh recommendations" variant="primary" />
        <JobRunButton job="self-audit" label="Run self-check" />
        <JobRunButton job="check-stale-listings" label="Check stale listings" />
        <Link href="/listings?filter=stale" className="btn-secondary">
          Review stale listings
        </Link>
      </section>

      <section className="space-y-2">
        <h2 className="section-label">Recent job runs</h2>
        {runs.length === 0 && (
          <div className="card text-sm text-zinc-500">
            No runs yet. Trigger one above or wait for the scheduled cron.
          </div>
        )}
        {runs.map((run) => (
          <div key={run.id} className="card p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{run.jobName}</span>
              <span className={`chip ${STATUS_STYLES[run.status] ?? ""}`}>
                {run.status}
                {run.dryRun ? " · dry run" : ""}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{run.summary}</p>
            <p className="mt-1 text-[11px] text-zinc-600">{fmt(run.startedAt)}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
