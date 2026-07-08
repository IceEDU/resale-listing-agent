import type { Insight } from "@/lib/types";

export default function PricingInsightPanel({ insight }: { insight: Insight }) {
  const span = insight.high * 1.15 - insight.low * 0.85;
  const pct = (v: number) => `${Math.round(((v - insight.low * 0.85) / span) * 100)}%`;
  const trendUp = insight.trend90dPct > 0;

  return (
    <section className="card">
      <h2 className="section-label">AI pricing insight</h2>

      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-3xl font-semibold tracking-tight">${insight.estimate}</span>
        <span
          className={`text-sm font-medium ${trendUp ? "text-emerald-300" : insight.trend90dPct < 0 ? "text-red-300" : "text-zinc-500"}`}
        >
          {trendUp ? "▲" : insight.trend90dPct < 0 ? "▼" : "•"}{" "}
          {Math.abs(insight.trend90dPct)}% last 90 days
        </span>
      </div>

      <div className="mt-4">
        <div className="relative h-2 rounded-full bg-white/10">
          <div
            className="absolute h-2 rounded-full bg-gradient-to-r from-blue-500/60 to-violet-500/60"
            style={{ left: pct(insight.low), right: `calc(100% - ${pct(insight.high)})` }}
          />
          <div
            className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-white"
            style={{ left: pct(insight.estimate) }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-zinc-500">
          <span>Low ${insight.low}</span>
          <span>High ${insight.high}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/5 px-3 py-2.5">
          <div className="text-xs text-zinc-500">Chance it sells</div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full bg-emerald-400"
                style={{ width: `${insight.sellability}%` }}
              />
            </div>
            <span className="text-sm font-medium">{insight.sellability}%</span>
          </div>
        </div>
        <div className="rounded-xl bg-white/5 px-3 py-2.5">
          <div className="text-xs text-zinc-500">Time to sell</div>
          <div className="mt-1 text-sm font-medium">~{insight.daysToSell} days</div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{insight.explanation}</p>
      {insight.confidence === "low" && (
        <p className="mt-2 text-xs text-amber-300">
          Rough estimate, few similar sales found.
        </p>
      )}
    </section>
  );
}
