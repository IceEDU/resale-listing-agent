import type { AutomationRuleDef } from "@/lib/automation";

export default function AutomationRuleCard({ rule }: { rule: AutomationRuleDef }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{rule.label}</h3>
        <span className="chip bg-emerald-400/10 text-emerald-300">On</span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{rule.description}</p>
      <p className="mt-2 text-xs text-zinc-600">
        Suggests only. You approve every change, and assisted marketplaces are always
        updated by you.
      </p>
    </div>
  );
}
