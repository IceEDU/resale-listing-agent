import type { Health } from "@/lib/health";

const LABEL_COLORS: Record<Health["label"], string> = {
  Strong: "text-emerald-300",
  Good: "text-blue-300",
  "Needs Work": "text-amber-300",
  Poor: "text-red-300",
};

const RING_COLORS: Record<Health["label"], string> = {
  Strong: "stroke-emerald-400",
  Good: "stroke-blue-400",
  "Needs Work": "stroke-amber-400",
  Poor: "stroke-red-400",
};

export function HealthRing({ health, size = 40 }: { health: Health; size?: number }) {
  const r = 15.5;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 36 36" width={size} height={size} role="img" aria-label={`Health ${health.score} of 100`}>
      <circle cx="18" cy="18" r={r} fill="none" className="stroke-white/10" strokeWidth="3.5" />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        className={RING_COLORS[health.label]}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={`${(health.score / 100) * c} ${c}`}
        transform="rotate(-90 18 18)"
      />
      <text
        x="18"
        y="19"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-zinc-100"
        fontSize="11"
        fontWeight="600"
      >
        {health.score}
      </text>
    </svg>
  );
}

export default function ListingHealthScore({ health }: { health: Health }) {
  return (
    <section className="card">
      <div className="flex items-center gap-3">
        <HealthRing health={health} size={52} />
        <div>
          <h2 className="section-label">Listing health</h2>
          <p className={`text-base font-semibold ${LABEL_COLORS[health.label]}`}>
            {health.label}
          </p>
        </div>
      </div>
      {health.fixes.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {health.fixes.map((f) => (
            <li key={f} className="flex gap-2 text-sm text-zinc-300">
              <span className="mt-0.5 text-amber-400">•</span>
              {f}
            </li>
          ))}
        </ul>
      )}
      {health.reasons.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {health.reasons.map((r) => (
            <li key={r} className="flex gap-2 text-sm text-zinc-500">
              <span className="mt-0.5 text-emerald-400">✓</span>
              {r}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
