"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MarketplacePostingPlan } from "@/lib/marketplace-posting";
import type { Item } from "@/lib/types";

function CopyButton({ value, children }: { value: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
        copied ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-zinc-200"
      }`}
    >
      {copied ? "Copied ✓" : children}
    </button>
  );
}

function StatusPill({ plan }: { plan: MarketplacePostingPlan }) {
  const styles = {
    ready_to_copy: "bg-emerald-400/10 text-emerald-300",
    needs_official_api: "bg-blue-400/10 text-blue-300",
    missing_required_info: "bg-amber-400/10 text-amber-300",
  }[plan.status];
  const label = {
    ready_to_copy: "Ready to copy",
    needs_official_api: "API stub / manual test",
    missing_required_info: "Missing info",
  }[plan.status];

  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles}`}>{label}</span>;
}

function PlanCard({ item, plan }: { item: Item; plan: MarketplacePostingPlan }) {
  const assisted = plan.safetyMode === "assisted";

  return (
    <article className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{plan.label}</h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">{plan.safetyNote}</p>
        </div>
        <StatusPill plan={plan} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-relaxed text-zinc-400">
        <div className="font-semibold text-zinc-200">Next action</div>
        <p className="mt-1">{plan.nextAction}</p>
      </div>

      <div className="space-y-2">
        {plan.fields.map((field) => (
          <div key={field.key} className="rounded-xl bg-white/5 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">
                  {field.label} {field.required ? "*" : ""}
                </div>
                <div className="mt-1 truncate text-sm text-zinc-200">{field.value || "Missing"}</div>
              </div>
              <CopyButton value={field.value}>Copy</CopyButton>
            </div>
            <p className="mt-1 text-xs text-zinc-500">{field.hint}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <CopyButton value={plan.copyBundle}>Copy {plan.label} bundle</CopyButton>
        {assisted ? (
          <Link href={`/items/${item.id}/assist/${plan.marketplace}`} className="rounded-full bg-gradient-to-r from-blue-500 to-violet-500 px-3 py-1.5 text-xs font-semibold text-white">
            Guided assist flow
          </Link>
        ) : (
          <a href={plan.createUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200">
            Open manual sell page ↗
          </a>
        )}
      </div>
    </article>
  );
}

export default function MarketplacePostingLab({
  items,
  plansByItem,
  allBundlesByItem,
}: {
  items: Item[];
  plansByItem: Record<string, MarketplacePostingPlan[]>;
  allBundlesByItem: Record<string, string>;
}) {
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const selected = useMemo(() => items.find((item) => item.id === itemId) ?? items[0], [itemId, items]);

  if (!selected) {
    return (
      <div className="card border-dashed text-center">
        <p className="text-sm text-zinc-500">No items yet. Create a draft first, then return to the lab.</p>
        <Link href="/new" className="btn-primary mt-3">
          Create first item
        </Link>
      </div>
    );
  }

  const plans = plansByItem[selected.id] ?? [];

  return (
    <div className="space-y-4">
      <section className="card space-y-3">
        <div>
          <h2 className="section-label">Test item</h2>
          <select
            value={selected.id}
            onChange={(event) => setItemId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-3 text-sm text-zinc-100 outline-none focus:border-blue-400"
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} · ${item.price}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-2xl bg-white/5 p-3 text-sm leading-relaxed text-zinc-400">
          <div className="font-semibold text-zinc-100">{selected.title}</div>
          <div className="mt-1">{selected.description}</div>
        </div>
        <CopyButton value={allBundlesByItem[selected.id] ?? ""}>Copy all marketplace bundles</CopyButton>
      </section>

      <div className="grid gap-3">
        {plans.map((plan) => (
          <PlanCard key={plan.marketplace} item={selected} plan={plan} />
        ))}
      </div>
    </div>
  );
}
