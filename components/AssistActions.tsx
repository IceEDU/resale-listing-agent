"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
  photoChecklist,
  createUrl,
  mode = "post",
}: {
  itemId: string;
  marketplace: string;
  title: string;
  price: number;
  body: string;
  photoChecklist: string[];
  createUrl: string;
  mode?: "post" | "refresh";
}) {
  const router = useRouter();
  const [checked, setChecked] = useState<boolean[]>(photoChecklist.map(() => false));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markPosted() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/items/${itemId}/listings/${marketplace}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "refresh" ? { action: "refreshed" } : { status: "assisted_posted" },
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
        <CopyRow label="Title" value={title} />
        <CopyRow label="Price" value={String(price)} />
        <CopyRow label="Description" value={body} />
      </section>

      <section className="card">
        <h2 className="section-label">2. Photo checklist</h2>
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
        3. Open the marketplace ↗
      </a>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <button type="button" onClick={markPosted} disabled={busy} className="btn-primary">
        {busy ? "Saving…" : mode === "refresh" ? "4. I reposted it" : "4. I posted it"}
      </button>
    </div>
  );
}
