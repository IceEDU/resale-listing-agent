import type { PricePoint } from "@/lib/types";

/**
 * Placeholder price history chart: a simple inline sparkline over recorded
 * price points. Swap for a real charting library when history gets dense.
 */
export default function PriceHistoryChart({ history }: { history: PricePoint[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-zinc-500">No price changes recorded yet.</p>;
  }

  const prices = history.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = Math.max(max - min, 1);
  const w = 280;
  const h = 60;
  const step = history.length > 1 ? w / (history.length - 1) : 0;
  const points = history
    .map((p, i) => `${i * step},${h - 8 - ((p.price - min) / span) * (h - 16)}`)
    .join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Price history">
        <polyline
          points={points}
          fill="none"
          className="stroke-blue-400"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {history.map((p, i) => (
          <circle
            key={p.id}
            cx={i * step}
            cy={h - 8 - ((p.price - min) / span) * (h - 16)}
            r="3"
            className="fill-blue-300"
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-zinc-500">
        <span>${history[0].price}</span>
        <span>${history[history.length - 1].price} now</span>
      </div>
    </div>
  );
}
