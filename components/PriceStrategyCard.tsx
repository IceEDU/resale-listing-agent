import type { AgentListing } from "@/lib/agent/types";

export default function PriceStrategyCard({ pricing }: { pricing: AgentListing["pricing"] }) {
  const s = pricing.strategy;
  const tiles = [
    { label: "Max profit", value: s.maxProfit, active: pricing.goal === "max_profit" },
    { label: "Realistic", value: s.realistic, active: pricing.goal === "balanced" },
    { label: "Fast sale", value: s.fastSale, active: pricing.goal === "fast_sale" },
    { label: "Floor", value: s.floor, active: false },
  ];

  return (
    <section className="card">
      <h2 className="section-label">Price strategy</h2>
      <div className="mt-2.5 grid grid-cols-4 gap-2">
        {tiles.map((t) => (
          <div
            key={t.label}
            className={`rounded-xl px-2 py-2.5 text-center ${
              t.active
                ? "bg-gradient-to-b from-blue-500/20 to-violet-500/10 ring-1 ring-blue-400"
                : "bg-white/5"
            }`}
          >
            <div className="text-sm font-semibold">${t.value}</div>
            <div className="mt-0.5 text-[11px] leading-tight text-zinc-500">{t.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-zinc-400">
        Recommended <span className="font-semibold text-zinc-100">${pricing.recommended}</span>,
        never accept below{" "}
        <span className="font-semibold text-zinc-100">${pricing.minTake}</span>
      </p>
    </section>
  );
}
