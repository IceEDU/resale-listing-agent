"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RefreshInsightButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/items/${itemId}/insights`, { method: "POST" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("Couldn't refresh the price check, try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={refresh} disabled={busy} className="btn-secondary">
        {busy ? "Checking prices…" : "Refresh price check"}
      </button>
      {error && <p className="mt-1.5 text-sm text-red-300">{error}</p>}
    </div>
  );
}
