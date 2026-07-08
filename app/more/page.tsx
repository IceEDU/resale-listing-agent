import Link from "next/link";
import AutomationRuleCard from "@/components/AutomationRuleCard";
import { DEFAULT_RULES } from "@/lib/automation";
import { storageMode } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function MorePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">More</h1>

      <section className="space-y-3">
        <h2 className="section-label">Service</h2>
        <Link href="/more/automation" className="card block active:bg-white/5">
          <div className="text-sm font-semibold">Automation service →</div>
          <p className="mt-1 text-sm text-zinc-500">
            Job runs, service status, and manual triggers for refresh and stale checks.
          </p>
        </Link>
        <Link href="/more/audit" className="card block active:bg-white/5">
          <div className="text-sm font-semibold">Self-check →</div>
          <p className="mt-1 text-sm text-zinc-500">
            The app audits its own data, prices, and connector honesty.
          </p>
        </Link>
        <Link href="/more/agents" className="card block active:bg-white/5">
          <div className="text-sm font-semibold">Marketplace agents →</div>
          <p className="mt-1 text-sm text-zinc-500">
            Facebook-first assisted posting playbooks, Amazon research guardrails, and category specialists.
          </p>
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="section-label">Automation rules</h2>
        {DEFAULT_RULES.map((rule) => (
          <AutomationRuleCard key={rule.id} rule={rule} />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="section-label">How your data is handled</h2>
        <div className="card space-y-2 text-sm leading-relaxed text-zinc-400">
          <p>Photos are only analyzed and stored after you check the consent box, and location data is stripped first.</p>
          <p>Facebook, Craigslist, Mercari, and Poshmark are assisted only: the app prepares text and opens the marketplace, you post. No scraping, no login automation.</p>
          <p>eBay and Etsy connectors are stubs until you add official API credentials. The app never fakes a live posting.</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="section-label">App</h2>
        <div className="card text-sm text-zinc-400">
          Storage mode:{" "}
          <span className="font-medium text-zinc-200">
            {storageMode() === "prisma" ? "Postgres (persistent)" : "In-memory demo"}
          </span>
        </div>
      </section>
    </div>
  );
}
