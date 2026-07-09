"use client";

import { useCallback, useEffect, useState } from "react";
import { LISTING_STATUS_LABELS, type ListingStatus } from "@/lib/types";

type ItemOption = { id: string; title: string; price: number };

type Draft = {
  marketplace: string;
  label: string;
  mode: "assisted" | "api_stub" | "advisory";
  safetyWarnings: string[];
  analysis: { summary: string; strengths: string[]; gaps: string[] };
  price: {
    list: number;
    realisticTake?: number;
    fastSale?: number;
    floor?: number;
    reasoning: string;
  };
  copy: { title: string; description: string; keywords: string[] };
  fields: { field: string; label: string; ok: boolean; hint?: string }[];
  nextAction: { label: string; href?: string; externalUrl?: string };
  strategy: string[];
  extraGuidance: { label: string; lines: string[] }[];
  category: { label: string; photoChecklist: string[]; pricingNotes: string[] };
  listingStatus: ListingStatus | null;
  listingUrl: string | null;
};

const MARKETPLACES: { id: string; label: string }[] = [
  { id: "facebook", label: "Facebook" },
  { id: "ebay", label: "eBay" },
  { id: "craigslist", label: "Craigslist" },
  { id: "mercari", label: "Mercari" },
  { id: "poshmark", label: "Poshmark" },
  { id: "etsy", label: "Etsy" },
  { id: "amazon", label: "Amazon" },
];

const MODE_META = {
  assisted: { label: "Assisted: you post", classes: "bg-blue-400/10 text-blue-300" },
  api_stub: { label: "API stub: honest draft", classes: "bg-amber-400/10 text-amber-300" },
  advisory: { label: "Advisory only", classes: "bg-zinc-400/10 text-zinc-300" },
} as const;

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
        copied
          ? "bg-emerald-400/15 text-emerald-300"
          : "bg-gradient-to-r from-blue-500 to-violet-500 text-white"
      }`}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}

function buildPostingPacket(draft: Draft) {
  return [
    `Title: ${draft.copy.title}`,
    `Price: $${draft.price.list}`,
    "",
    draft.copy.description,
    "",
    `Realistic take: $${draft.price.realisticTake ?? draft.price.list}`,
    `Fast-sale price: $${draft.price.fastSale ?? draft.price.list}`,
    `Floor: $${draft.price.floor ?? draft.price.fastSale ?? draft.price.list}`,
    "",
    "Reminder: post manually on the official marketplace page, then paste the live URL back into the app.",
  ].join("\n");
}

const FACEBOOK_POSTING_STEPS = [
  "Copy the title, price, and description into Facebook Marketplace manually.",
  "Upload clean daylight photos: front, sides, model/serial label, included accessories, and any flaws.",
  "Use the safe pickup wording; do not put your full address in the public listing.",
  "Publish from Facebook yourself — this app never logs in, scrapes, clicks, or posts for you.",
  "Paste the listing URL here and tap ‘I posted it myself’ so tracking starts.",
  "After 24–48 hours, log views, saves, and messages; if silent for 7–14 days, refresh or repost with a better first photo.",
];

export default function MarketplaceLab({ items }: { items: ItemOption[] }) {
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [marketplace, setMarketplace] = useState("facebook");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listingUrl, setListingUrl] = useState("");
  const [posting, setPosting] = useState(false);
  const [postedMsg, setPostedMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    setError(null);
    setPostedMsg(null);
    try {
      const res = await fetch(`/api/marketplace-agents/${itemId}/${marketplace}`);
      if (!res.ok) throw new Error();
      setDraft(await res.json());
    } catch {
      setDraft(null);
      setError("Couldn't generate the draft, try again.");
    } finally {
      setLoading(false);
    }
  }, [itemId, marketplace]);

  useEffect(() => {
    load();
  }, [load]);

  async function markPosted() {
    setPosting(true);
    setPostedMsg(null);
    try {
      const res = await fetch(`/api/items/${itemId}/listings/${marketplace}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_posted", externalUrl: listingUrl || undefined }),
      });
      if (!res.ok) throw new Error();
      setPostedMsg("Tracked: listing marked as posted by you.");
      setListingUrl("");
      await load();
    } catch {
      setPostedMsg("Couldn't update the listing, try again.");
    } finally {
      setPosting(false);
    }
  }

  const missing = draft?.fields.filter((f) => !f.ok) ?? [];

  return (
    <div className="space-y-4">
      <section className="card space-y-3">
        <label className="block text-sm font-medium">
          Item
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="input">
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title} (${i.price})
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="text-sm font-medium">Marketplace</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {MARKETPLACES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMarketplace(m.id)}
                className={`rounded-full px-3.5 py-2 text-sm ${
                  marketplace === m.id
                    ? "bg-white font-medium text-zinc-950"
                    : "border border-white/10 bg-white/5 text-zinc-400"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading && <div className="card text-sm text-zinc-500">Generating draft…</div>}
      {error && <div className="card text-sm text-red-300">{error}</div>}

      {draft && !loading && (
        <>
          <section className="card">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold">{draft.label}</h2>
              <span className={`chip ${MODE_META[draft.mode].classes}`}>
                {MODE_META[draft.mode].label}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {draft.analysis.summary}
            </p>
            {draft.listingStatus && (
              <p className="mt-2 text-xs text-zinc-500">
                Current status:{" "}
                <span className="text-zinc-300">
                  {LISTING_STATUS_LABELS[draft.listingStatus]}
                </span>
                {draft.listingUrl && (
                  <>
                    {" · "}
                    <a
                      href={draft.listingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300"
                    >
                      view listing ↗
                    </a>
                  </>
                )}
              </p>
            )}
          </section>

          {draft.safetyWarnings.length > 0 && (
            <section className="card border-amber-400/20 bg-amber-500/10">
              <h2 className="section-label text-amber-300">Know before you list</h2>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-amber-200/90">
                {draft.safetyWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="card">
            <h2 className="section-label">Price</h2>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {[
                { label: "List", value: draft.price.list },
                { label: "Take", value: draft.price.realisticTake },
                { label: "Fast", value: draft.price.fastSale },
                { label: "Floor", value: draft.price.floor },
              ]
                .filter((t) => t.value !== undefined)
                .map((t) => (
                  <div key={t.label} className="rounded-xl bg-white/5 px-2 py-2.5 text-center">
                    <div className="text-sm font-semibold">${t.value}</div>
                    <div className="mt-0.5 text-[11px] text-zinc-500">{t.label}</div>
                  </div>
                ))}
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">
              {draft.price.reasoning}
            </p>
          </section>

          <section className="card space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="section-label">Draft: copy each field</h2>
              <CopyButton label="Copy packet" value={buildPostingPacket(draft)} />
            </div>
            <p className="text-xs leading-relaxed text-zinc-500">
              The packet gives you everything in one clipboard pass; the field buttons are
              there when a marketplace asks for one box at a time.
            </p>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2.5">
              <div className="min-w-0">
                <div className="text-xs text-zinc-500">Title</div>
                <div className="truncate text-sm">{draft.copy.title}</div>
              </div>
              <CopyButton label="Copy" value={draft.copy.title} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2.5">
              <div>
                <div className="text-xs text-zinc-500">Price</div>
                <div className="text-sm">${draft.price.list}</div>
              </div>
              <CopyButton label="Copy" value={String(draft.price.list)} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2.5">
              <div className="min-w-0">
                <div className="text-xs text-zinc-500">Description</div>
                <div className="truncate text-sm">{draft.copy.description.split("\n")[0]}</div>
              </div>
              <CopyButton label="Copy" value={draft.copy.description} />
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {draft.copy.keywords.map((k) => (
                <span key={k} className="chip bg-white/5 text-zinc-400">
                  {k}
                </span>
              ))}
            </div>
          </section>

          {missing.length > 0 && (
            <section className="card border-red-400/20 bg-red-500/10">
              <h2 className="section-label text-red-300">Missing before posting</h2>
              <ul className="mt-2 space-y-1.5">
                {missing.map((f) => (
                  <li key={f.field} className="text-sm text-red-200/90">
                    <span className="font-medium">{f.label}:</span> {f.hint}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {marketplace === "facebook" && (
            <section className="card border-blue-400/20 bg-blue-500/10">
              <h2 className="section-label text-blue-200">
                Post one item to Facebook Marketplace safely
              </h2>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-blue-100/90">
                {FACEBOOK_POSTING_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          )}

          <section className="card">
            <h2 className="section-label">Strategy</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-zinc-300">
              {draft.strategy.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>

          {draft.extraGuidance.map((g) => (
            <section key={g.label} className="card">
              <h2 className="section-label">{g.label}</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-zinc-300">
                {g.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </section>
          ))}

          <section className="card">
            <h2 className="section-label">
              {draft.category.label}: photo checklist
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-300">
              {draft.category.photoChecklist.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>

          <section className="card space-y-2.5">
            <h2 className="section-label">Post it yourself</h2>
            {draft.nextAction.externalUrl && (
              <a
                href={draft.nextAction.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Open {draft.label} ↗
              </a>
            )}
            <p className="text-xs leading-relaxed text-zinc-500">{draft.nextAction.label}</p>
            {draft.mode !== "assisted" ? (
              <p className="text-xs text-zinc-500">
                {draft.mode === "api_stub"
                  ? "This marketplace needs an official API connector before the app can track a live posting. Use this draft as preparation only."
                  : "Tracking for this marketplace isn't supported yet, so there is nothing to mark posted here."}
              </p>
            ) : (
              <>
                <label className="block text-sm font-medium">
                  Listing URL (optional)
                  <input
                    value={listingUrl}
                    onChange={(e) => setListingUrl(e.target.value)}
                    placeholder="https://…"
                    className="input"
                  />
                </label>
                <button
                  type="button"
                  onClick={markPosted}
                  disabled={posting}
                  className="btn-primary"
                >
                  {posting ? "Saving…" : "I posted it myself"}
                </button>
              </>
            )}
            {postedMsg && <p className="text-sm text-emerald-300">{postedMsg}</p>}
          </section>
        </>
      )}
    </div>
  );
}
