"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MarketplaceOption } from "@/lib/connectors";
import type { MarketplaceId } from "@/lib/types";

type PostResult = {
  marketplace: MarketplaceId;
  mode: "api" | "assisted";
  ok: boolean;
  note: string;
};

export default function PostOptions({
  itemId,
  options,
}: {
  itemId: string;
  options: MarketplaceOption[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<MarketplaceId>>(new Set(["facebook"]));
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<PostResult[] | null>(null);

  function toggle(id: MarketplaceId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function post() {
    setBusy(true);
    const res = await fetch(`/api/items/${itemId}/listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketplaces: [...selected] }),
    });
    const body = await res.json();
    setResults(body.results ?? []);
    setBusy(false);
    router.refresh();
  }

  if (results) {
    return (
      <div className="space-y-3">
        {results.map((r) => (
          <div key={r.marketplace} className="card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize">{r.marketplace}</span>
              <span className={`text-xs ${r.ok ? "text-emerald-300" : "text-amber-300"}`}>
                {r.ok ? "Ready" : "Saved as draft"}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{r.note}</p>
            {r.mode === "assisted" && (
              <Link
                href={`/items/${itemId}/assist/${r.marketplace}`}
                className="mt-2.5 inline-block rounded-full bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Open pre-filled draft
              </Link>
            )}
          </div>
        ))}
        <Link href="/" className="btn-secondary">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {options.map((o) => (
        <label key={o.id} className="card flex items-start gap-3 p-3.5">
          <input
            type="checkbox"
            checked={selected.has(o.id)}
            onChange={() => toggle(o.id)}
            className="mt-0.5 h-5 w-5 accent-blue-500"
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium">{o.label}</span>
            <span className="block text-xs text-zinc-500">{o.blurb}</span>
          </span>
        </label>
      ))}

      <button
        type="button"
        disabled={selected.size === 0 || busy}
        onClick={post}
        className="btn-primary"
      >
        {busy ? "Posting…" : `Post to ${selected.size} marketplace${selected.size === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}
