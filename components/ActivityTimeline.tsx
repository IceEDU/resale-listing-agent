import type { Item } from "@/lib/types";

type Event = { at: string; text: string; kind: "price" | "stats" | "advice" };

const DOT: Record<Event["kind"], string> = {
  price: "bg-blue-400",
  stats: "bg-emerald-400",
  advice: "bg-amber-400",
};

export default function ActivityTimeline({ item }: { item: Item }) {
  const events: Event[] = [
    ...item.priceHistory.map((p) => ({
      at: p.createdAt,
      text: `Price set to $${p.price} (${p.source}${p.reason ? `: ${p.reason}` : ""})`,
      kind: "price" as const,
    })),
    ...item.metrics.map((m) => ({
      at: m.createdAt,
      text: `Stats logged: ${m.views} views, ${m.saves} saves, ${m.messages} messages${m.marketplace ? ` on ${m.marketplace}` : ""}`,
      kind: "stats" as const,
    })),
    ...item.recommendations
      .filter((r) => r.status !== "pending")
      .map((r) => ({
        at: r.createdAt,
        text: `Recommendation ${r.status}: ${r.message}`,
        kind: "advice" as const,
      })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  if (events.length === 0) {
    return <p className="text-sm text-zinc-500">No activity yet.</p>;
  }

  return (
    <ol className="space-y-3">
      {events.slice(0, 12).map((e, i) => (
        <li key={`${e.at}-${i}`} className="flex gap-3">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[e.kind]}`} />
          <div>
            <p className="text-sm leading-snug text-zinc-300">{e.text}</p>
            <p className="text-xs text-zinc-600">
              {new Date(e.at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
