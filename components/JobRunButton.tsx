"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function JobRunButton({
  job,
  label,
  variant = "secondary",
}: {
  job: string;
  label: string;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/jobs/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job }),
    });
    const body = await res.json().catch(() => ({}));
    setResult(res.ok ? body.summary : (body.error ?? "Failed"));
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className={variant === "primary" ? "btn-primary" : "btn-secondary"}
      >
        {busy ? "Running…" : label}
      </button>
      {result && <p className="mt-1.5 text-xs text-zinc-500">{result}</p>}
    </div>
  );
}
