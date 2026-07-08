import type { RecommendationType } from "./types";

/**
 * Default automation strategies. Every rule only ever *suggests*: the
 * recommendation feed requires the user to accept, and assisted marketplaces
 * always require the user to apply the change on the marketplace themselves.
 */
export type AutomationRuleDef = {
  id: string;
  type: RecommendationType;
  label: string;
  description: string;
  config: Record<string, number>;
};

export const DEFAULT_RULES: AutomationRuleDef[] = [
  {
    id: "rule_price_drop",
    type: "price_drop",
    label: "Nudge stale prices down",
    description:
      "If a listing has no messages after 5 days, suggest an 8 percent price drop. Never below the floor price.",
    config: { quietDays: 5, dropPct: 8 },
  },
  {
    id: "rule_repost",
    type: "repost",
    label: "Repost old Facebook listings",
    description:
      "If a Facebook listing is older than 14 days, suggest a repost or refresh so it surfaces in search again.",
    config: { staleDays: 14 },
  },
  {
    id: "rule_hold",
    type: "hold",
    label: "Hold when buyers are talking",
    description:
      "If a listing has recent messages, suggest holding the price instead of dropping it.",
    config: { recentDays: 7 },
  },
  {
    id: "rule_fix_first",
    type: "fix_title",
    label: "Fix the listing before the price",
    description:
      "If the title or photos are weak, suggest fixing them before any price drop. A bad listing at a lower price is still a bad listing.",
    config: { minPhotos: 3 },
  },
];
