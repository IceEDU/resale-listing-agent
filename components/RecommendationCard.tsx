"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ASSISTED_TARGETS, type AssistedId } from "@/lib/connectors/assisted";
import type { RecommendationFeedEntry, RecommendationPriority } from "@/lib/types";

const PRIORITY_META: Record<RecommendationPriority, { label: string; classes: string }> = {
  high: { label: "High", classes: "bg-red-400/10 text-red-300" },
  medium: { label: "Medium", classes: "bg-amber-400/10 text-amber-300" },
  low: { label: "Low", classes: "bg-zinc-400/10 text-zinc-300" },
};

const TYPE_LABELS: Record<string, string> = {
  price_drop: "Price drop",
  repost: "Repost",
  repost_assisted: "Repost",
  fix_title: "Fix title",
  fix_photos: "Photos",
  hold: "Hold",
  refresh_keywords: "Keywords",
  refresh_listing: "Refresh listing",
  check_messages: "Messages",
  update_manual_stats: "Log stats",
};

export default function RecommendationCard({ rec }: { rec: RecommendationFeedEntry }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [phase, setPhase] = useState(rec.status);

  async function setStatus(status: string) {
    setBusy(true);
    const res = await fetch(`/api/recommendations/${rec.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setPhase(status as typeof rec.status);
      router.refresh();
    }
    setBusy(false);
  }

  async function copyPrice() {
    if (!rec.suggestedAction?.newPrice) return;
    await navigator.clipboard.writeText(String(rec.suggestedAction.newPrice));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const assisted =
    rec.marketplace && rec.marketplace in ASSISTED_TARGETS
      ? ASSISTED_TARGETS[rec.marketplace as AssistedId]
      : undefined;

  if (phase === "dismissed") {
    return (
      <div className="card opacity-50">
        <p className="text-sm text-zinc-500">Dismissed: {rec.message}</p>
      </div>
    );
  }
  if (phase === "done") {
    return (
      <div className="card opacity-60">
        <p className="text-sm text-zinc-400">
          <span className="text-emerald-400">✓</span> Done: {rec.message}
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className={`chip ${PRIORITY_META[rec.priority].classes}`}>
            {PRIORITY_META[rec.priority].label}
          </span>
          <span className="chip bg-white/5 text-zinc-400">
            {TYPE_LABELS[rec.type] ?? rec.type}
          </span>
        </div>
        <Link href={`/items/${rec.itemId}`} className="shrink-0 text-xs text-zinc-500">
          {rec.itemTitle.length > 18 ? `${rec.itemTitle.slice(0, 18)}…` : rec.itemTitle}
        </Link>
      </div>

      <p className="mt-2.5 text-[15px] font-medium leading-snug">{rec.message}</p>

      {phase === "pending" && (
        <div className="mt-3.5 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setStatus("accepted")}
            className="flex-1 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Accept
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setStatus("dismissed")}
            className="flex-1 rounded-full border border-white/15 bg-white/5 py-2.5 text-sm font-medium disabled:opacity-40"
          >
            Dismiss
          </button>
        </div>
      )}

      {phase === "accepted" && (
        <div className="mt-3.5 space-y-2">
          <p className="text-xs text-zinc-500">
            Accepted. Apply it on the marketplace yourself, then mark it updated.
          </p>
          {rec.suggestedAction?.newPrice !== undefined && (
            <button type="button" onClick={copyPrice} className="btn-secondary">
              {copied ? "Copied ✓" : `Copy new price ($${rec.suggestedAction.newPrice})`}
            </button>
          )}
          {assisted &&
          (rec.type === "repost_assisted" || rec.type === "refresh_listing") ? (
            <Link
              href={`/items/${rec.itemId}/assist/${rec.marketplace}?mode=refresh`}
              className="btn-secondary"
            >
              Open guided repost
            </Link>
          ) : assisted ? (
            <a
              href={assisted.createUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Open {assisted.label} ↗
            </a>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => setStatus("done")}
            className="btn-primary"
          >
            I updated it manually
          </button>
        </div>
      )}
    </div>
  );
}
