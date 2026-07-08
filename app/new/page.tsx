"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const inputClass = "input";

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mt-1 flex gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-full border px-2 py-2.5 text-sm ${
            value === o.value
              ? "border-blue-400 bg-blue-500/15 font-medium text-blue-200"
              : "border-white/10 bg-white/5 text-zinc-400"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function NewItemPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [hint, setHint] = useState("");
  const [condition, setCondition] = useState<"new" | "open_box" | "used" | undefined>();
  const [missingParts, setMissingParts] = useState("");
  const [paidPrice, setPaidPrice] = useState("");
  const [goal, setGoal] = useState<"fast_sale" | "balanced" | "max_profit">("balanced");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFiles(files: FileList | null) {
    if (!files) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...urls].slice(0, 8));
  }

  async function analyze() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hint,
          photoCount: previews.length,
          consent,
          answers: {
            condition,
            missingParts: missingParts || undefined,
            paidPrice: paidPrice ? Number(paidPrice) : undefined,
            goal,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong.");
      }
      const item = await res.json();
      router.push(`/items/${item.id}/review`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New item</h1>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-white/15 bg-white/5 py-10 active:bg-white/10"
      >
        <span className="text-3xl leading-none text-zinc-500">+</span>
        <span className="text-sm font-medium">Take or add photos</span>
        <span className="text-xs text-zinc-500">Up to 8 photos</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        hidden
        onChange={(e) => onFiles(e.target.files)}
      />

      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {previews.map((src, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={src}
              src={src}
              alt={`Photo ${i + 1}`}
              className="aspect-square w-full rounded-xl object-cover"
            />
          ))}
        </div>
      )}

      <label className="block">
        <span className="text-sm font-medium">What is it? (optional)</span>
        <input
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="e.g. iPhone 12, 64GB"
          className={inputClass}
        />
      </label>

      <section className="card space-y-3">
        <div>
          <h2 className="text-sm font-medium">A few quick questions</h2>
          <p className="text-xs text-zinc-500">
            All optional. Answers make the pricing and listing copy better.
          </p>
        </div>

        <div>
          <span className="text-sm font-medium">Is it new, open-box, or used?</span>
          <Segmented
            options={[
              { value: "new", label: "New" },
              { value: "open_box", label: "Open box" },
              { value: "used", label: "Used" },
            ]}
            value={condition}
            onChange={setCondition}
          />
        </div>

        <label className="block">
          <span className="text-sm font-medium">Any missing parts?</span>
          <input
            value={missingParts}
            onChange={(e) => setMissingParts(e.target.value)}
            placeholder="None"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">What did you pay? ($)</span>
          <input
            type="number"
            inputMode="decimal"
            value={paidPrice}
            onChange={(e) => setPaidPrice(e.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </label>

        <div>
          <span className="text-sm font-medium">Fast sale or max profit?</span>
          <Segmented
            options={[
              { value: "fast_sale", label: "Fast sale" },
              { value: "balanced", label: "Balanced" },
              { value: "max_profit", label: "Max profit" },
            ]}
            value={goal}
            onChange={setGoal}
          />
        </div>
      </section>

      <label className="card flex items-start gap-3 p-3.5">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-5 w-5 accent-blue-500"
        />
        <span className="text-sm leading-snug text-zinc-300">
          Analyze and store these photos to identify my item and suggest a price. Location
          data is removed, photos stay private, and I can delete them anytime.
        </span>
      </label>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <button
        type="button"
        disabled={!consent || previews.length === 0 || busy}
        onClick={analyze}
        className="btn-primary"
      >
        {busy ? "Generating your listing…" : "Generate listing"}
      </button>
      <p className="text-center text-xs text-zinc-600">
        Nothing gets posted without your review. Photos stay on this device in the scaffold —
        analysis uses mock data.
      </p>
    </div>
  );
}
