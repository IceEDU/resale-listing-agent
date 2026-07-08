"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RefreshInsightButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    await fetch(`/api/items/${itemId}/insights`, { method: "POST" });
    router.refresh();
    setBusy(false);
  }

  return (
    <button type="button" onClick={refresh} disabled={busy} className="btn-secondary">
      {busy ? "Checking prices…" : "Refresh price check"}
    </button>
  );
}
