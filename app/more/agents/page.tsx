import Link from "next/link";
import {
  CATEGORY_AGENT_PROFILES,
  MARKETPLACE_AGENT_PROFILES,
  type AgentGuardrail,
} from "@/lib/marketplace-agents";

export const dynamic = "force-dynamic";

const marketplaceProfiles = Object.values(MARKETPLACE_AGENT_PROFILES);
const categoryProfiles = Object.values(CATEGORY_AGENT_PROFILES);

function modeLabel(mode: string) {
  switch (mode) {
    case "assisted-only":
      return "Assisted only";
    case "official-api":
      return "Official API gated";
    case "future-official-api":
      return "Future API research";
    default:
      return mode;
  }
}

function GuardrailPill({ guardrail }: { guardrail: AgentGuardrail }) {
  const tone =
    guardrail.severity === "blocker"
      ? "border-red-400/30 bg-red-500/10 text-red-100"
      : guardrail.severity === "warning"
        ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
        : "border-blue-400/30 bg-blue-500/10 text-blue-100";

  return <li className={`rounded-xl border px-3 py-2 text-xs leading-relaxed ${tone}`}>{guardrail.text}</li>;
}

export default function MarketplaceAgentsPage() {
  return (
    <div className="space-y-5">
      <Link href="/more" className="text-sm text-zinc-500">
        ← More
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Marketplace agents</h1>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">
          Channel and category mini-agent playbooks for pricing, keywords, risks, and safe posting.
          Facebook and other non-API marketplaces stay assisted-only; Amazon stays research-only until
          SP-API credentials and eligibility checks exist.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="section-label">Seller channels</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {marketplaceProfiles.map((profile) => (
            <article key={profile.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-zinc-100">{profile.label}</h3>
                  <p className="mt-1 text-xs text-zinc-500">{modeLabel(profile.postingMode)}</p>
                </div>
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-400">
                  {profile.id}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Research focus</p>
                <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
                  {profile.researchFocus.slice(0, 4).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Posting strategy</p>
                <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
                  {profile.postingStrategy.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <ul className="space-y-2">
                {profile.guardrails.map((guardrail) => (
                  <GuardrailPill key={guardrail.text} guardrail={guardrail} />
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="section-label">Category specialists</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {categoryProfiles.map((profile) => (
            <article key={profile.id} className="card space-y-2">
              <h3 className="font-semibold text-zinc-100">{profile.label}</h3>
              <p className="text-xs leading-relaxed text-zinc-500">
                Keywords: {profile.keywords.slice(0, 5).join(", ")}
              </p>
              <p className="text-xs leading-relaxed text-zinc-400">
                Check: {profile.conditionChecks.slice(0, 3).join(" · ")}
              </p>
              <p className="text-xs leading-relaxed text-amber-100/80">
                Watch: {profile.riskFlags.slice(0, 3).join(" · ")}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
