"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RefreshRecommendationsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    await fetch("/api/recommendations", { method: "POST" });
    router.refresh();
    setBusy(false);
  }

  return (
    <button type="button" onClick={refresh} disabled={busy} className="btn-secondary">
      {busy ? "Rechecking your listings…" : "Recheck all listings"}
    </button>
  );
}
