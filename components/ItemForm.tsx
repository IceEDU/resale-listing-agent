"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Condition, Item } from "@/lib/types";
import { CONDITION_LABELS } from "@/lib/types";

export default function ItemForm({ item }: { item: Item }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: item.title,
    category: item.category,
    brand: item.brand,
    condition: item.condition,
    description: item.description,
    price: String(item.price),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price) || item.price }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      router.refresh();
    } catch {
      setError("Couldn't save, try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card space-y-3">
      <h2 className="section-label">Item details</h2>

      <label className="block text-sm font-medium">
        Title
        <input value={form.title} onChange={(e) => set("title", e.target.value)} className="input" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium">
          Category
          <input value={form.category} onChange={(e) => set("category", e.target.value)} className="input" />
        </label>
        <label className="block text-sm font-medium">
          Brand
          <input value={form.brand} onChange={(e) => set("brand", e.target.value)} className="input" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium">
          Condition
          <select
            value={form.condition}
            onChange={(e) => set("condition", e.target.value as Condition)}
            className="input"
          >
            {Object.entries(CONDITION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Your price ($)
          <input
            type="number"
            inputMode="decimal"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            className="input"
          />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Description
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className="input"
        />
      </label>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={save} disabled={saving} className="btn-secondary flex-1">
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </button>
        <Link href={`/items/${item.id}/post`} className="btn-primary flex-1">
          Choose marketplaces
        </Link>
      </div>
    </section>
  );
}
