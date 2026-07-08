import type { Confidence, Insight } from "./types";

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Mock pricing engine. Deterministic per (seed, basePrice) so the UI is
 * stable across reloads. Replace with the real comps + prediction model
 * described in DESIGN.md section 3.
 */
export function generateInsight(seed: string, basePrice: number): Insight {
  const h = hash(seed);
  const estimate = Math.round(basePrice * (0.9 + (h % 21) / 100));
  const low = Math.round(estimate * 0.82);
  const high = Math.round(estimate * 1.18);
  const trend90dPct = Number((((h % 130) - 60) / 10).toFixed(1));
  const sellability = 45 + (h % 51);
  const daysToSell = 4 + (h % 24);
  const compsCount = 6 + (h % 40);
  const confidence: Confidence =
    compsCount > 30 ? "high" : compsCount > 14 ? "medium" : "low";

  const direction =
    trend90dPct > 1 ? "drifting up" : trend90dPct < -1 ? "drifting down" : "holding steady";
  const explanation = `${compsCount} similar items sold recently for $${low}–$${high}; prices are ${direction}${
    Math.abs(trend90dPct) > 1 ? ` about ${Math.abs(trend90dPct)}%` : ""
  } over the last 90 days.`;

  return {
    estimate,
    low,
    high,
    trend90dPct,
    sellability,
    daysToSell,
    confidence,
    explanation,
    compsCount,
  };
}
