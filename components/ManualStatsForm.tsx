"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MarketplaceId } from "@/lib/types";

export default function ManualStatsForm({
  itemId,
  marketplaces,
}: {
  itemId: string;
  marketplaces: MarketplaceId[];
}) {
  const router = useRouter();
  const [marketplace, setMarketplace] = useState<string>(marketplaces[0] ?? "facebook");
  const [views, setViews] = useState("");
  const [saves, setSaves] = useState("");
  const [messages, setMessages] = useState("");
  const [listingUrl, setListingUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/items/${itemId}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketplace,
          views: Number(views) || 0,
          saves: Number(saves) || 0,
          messages: Number(messages) || 0,
          listingUrl: listingUrl || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setViews("");
      setSaves("");
      setMessages("");
      setNotes("");
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } catch {
      setError("Couldn't save the stats, try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-zinc-500">
        Marketplaces like Facebook do not share stats with apps, so log what you see on
        your listing. The agent uses it to decide what to suggest next.
      </p>
      <label className="block text-sm font-medium">
        Marketplace
        <select
          value={marketplace}
          onChange={(e) => setMarketplace(e.target.value)}
          className="input"
        >
          {(marketplaces.length ? marketplaces : ["facebook"]).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-3 gap-2">
        <label className="block text-sm font-medium">
          Views
          <input type="number" inputMode="numeric" value={views} onChange={(e) => setViews(e.target.value)} placeholder="0" className="input" />
        </label>
        <label className="block text-sm font-medium">
          Saves
          <input type="number" inputMode="numeric" value={saves} onChange={(e) => setSaves(e.target.value)} placeholder="0" className="input" />
        </label>
        <label className="block text-sm font-medium">
          Messages
          <input type="number" inputMode="numeric" value={messages} onChange={(e) => setMessages(e.target.value)} placeholder="0" className="input" />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Listing URL (optional)
        <input value={listingUrl} onChange={(e) => setListingUrl(e.target.value)} placeholder="https://…" className="input" />
      </label>
      <label className="block text-sm font-medium">
        Notes (optional)
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. two buyers asked about pickup" className="input" />
      </label>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button type="button" disabled={busy} onClick={submit} className="btn-primary">
        {busy ? "Saving…" : saved ? "Saved ✓ advice updated" : "Log stats"}
      </button>
    </div>
  );
}
