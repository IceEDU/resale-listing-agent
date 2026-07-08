"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AssistedField } from "@/lib/connectors/assisted";

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2.5">
      <div className="min-w-0">
        <div className="text-xs text-zinc-500">{label}</div>
        <div className="truncate text-sm">{value.split("\n")[0]}</div>
      </div>
      <button
        type="button"
        onClick={copy}
        className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${
          copied
            ? "bg-emerald-400/15 text-emerald-300"
            : "bg-gradient-to-r from-blue-500 to-violet-500 text-white"
        }`}
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
}

export default function AssistActions({
  itemId,
  marketplace,
  title,
  price,
  body,
  copyPacket,
  photoChecklist,
  fieldGuide,
  metricPrompts,
  createUrl,
  mode = "post",
}: {
  itemId: string;
  marketplace: string;
  title: string;
  price: number;
  body: string;
  copyPacket: string;
  photoChecklist: string[];
  fieldGuide: AssistedField[];
  metricPrompts: string[];
  createUrl: string;
  mode?: "post" | "refresh";
}) {
  const router = useRouter();
  const [checked, setChecked] = useState<boolean[]>(photoChecklist.map(() => false));
  const [listingUrl, setListingUrl] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markPosted() {
    setBusy(true);
    setError(null);
    const optionalMeta = {
      ...(listingUrl.trim() ? { externalUrl: listingUrl.trim() } : {}),
      ...(manualNote.trim() ? { manualStatusNote: manualNote.trim() } : {}),
    };
    const res = await fetch(`/api/items/${itemId}/listings/${marketplace}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "refresh"
          ? { action: "refreshed", ...optionalMeta }
          : { status: "assisted_posted", ...optionalMeta },
      ),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not update the listing.");
      setBusy(false);
      return;
    }
    router.push(`/items/${itemId}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <section className="card space-y-2">
        <h2 className="section-label">
          {mode === "refresh" ? "1. Copy the updated fields" : "1. Copy each field"}
        </h2>
        <CopyRow label="All fields packet" value={copyPacket} />
        <CopyRow label="Title" value={title} />
        <CopyRow label="Price" value={String(price)} />
        <CopyRow label="Description" value={body} />
        <p className="text-xs leading-relaxed text-zinc-500">
          The all-fields packet is for speed on mobile. It is still a clipboard helper only — no
          marketplace receives anything until you paste and post it yourself.
        </p>
      </section>

      <section className="card space-y-3">
        <div>
          <h2 className="section-label">2. Marketplace field order</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Use this as the manual form checklist. Nothing here is submitted automatically.
          </p>
        </div>
        <ol className="space-y-2">
          {fieldGuide.map((field, index) => (
            <li key={`${field.label}-${index}`} className="rounded-xl bg-white/5 px-3 py-2.5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-xs font-semibold text-blue-200">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="text-sm font-semibold text-zinc-100">{field.label}</p>
                    <p className="truncate text-sm text-zinc-300">{field.value}</p>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">{field.note}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h2 className="section-label">3. Photo checklist</h2>
        <ul className="mt-2 space-y-2">
          {photoChecklist.map((tip, i) => (
            <li key={tip}>
              <label className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={() =>
                    setChecked((prev) => prev.map((c, j) => (j === i ? !c : c)))
                  }
                  className="mt-0.5 h-4 w-4 accent-blue-500"
                />
                <span className="text-sm leading-snug text-zinc-300">{tip}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <a href={createUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
        4. Open the marketplace ↗
      </a>

      <section className="card space-y-3 border-emerald-400/20 bg-emerald-500/10">
        <div>
          <h2 className="section-label">5. What to track after posting</h2>
          <p className="mt-1 text-sm text-emerald-50/75">
            Enter these stats manually later so recommendations stay useful without scraping or
            marketplace login automation.
          </p>
        </div>
        <ul className="space-y-2 text-sm text-emerald-50/90">
          {metricPrompts.map((prompt) => (
            <li key={prompt}>• {prompt}</li>
          ))}
        </ul>
      </section>

      <section className="card space-y-3">
        <div>
          <h2 className="section-label">6. Save proof for follow-up</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Optional, but useful: paste the live listing URL or a short note after you post. This
            keeps future stats and refresh reminders tied to the right manual listing.
          </p>
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Listing URL
          </span>
          <input
            type="url"
            inputMode="url"
            value={listingUrl}
            onChange={(event) => setListingUrl(event.target.value)}
            placeholder="https://www.facebook.com/marketplace/item/..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none ring-blue-500/40 placeholder:text-zinc-600 focus:ring-2"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Manual note
          </span>
          <textarea
            value={manualNote}
            onChange={(event) => setManualNote(event.target.value)}
            placeholder="Posted with local pickup only; buyer messages should go through the marketplace."
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none ring-blue-500/40 placeholder:text-zinc-600 focus:ring-2"
          />
        </label>
      </section>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <button type="button" onClick={markPosted} disabled={busy} className="btn-primary">
        {busy ? "Saving…" : mode === "refresh" ? "7. I reposted it" : "7. I posted it"}
      </button>
    </div>
  );
}
