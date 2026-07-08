import type { AgentListing, SellerAnswers } from "./agent/types";

export const MARKETPLACES = [
  "ebay",
  "etsy",
  "facebook",
  "craigslist",
  "mercari",
  "poshmark",
] as const;

export type MarketplaceId = (typeof MARKETPLACES)[number];

export type ListingMode = "api" | "assisted";
export type ListingStatus =
  | "draft"
  | "ready"
  | "assisted_posted"
  | "active"
  | "sold"
  | "delisted";
export type ItemStatus = "draft" | "active" | "sold" | "stale";
export type Condition = "new" | "like_new" | "good" | "fair" | "for_parts";
export type Confidence = "low" | "medium" | "high";

export type Insight = {
  estimate: number;
  low: number;
  high: number;
  trend90dPct: number;
  sellability: number;
  daysToSell: number;
  confidence: Confidence;
  explanation: string;
  compsCount: number;
};

export type Listing = {
  marketplace: MarketplaceId;
  mode: ListingMode;
  status: ListingStatus;
  externalUrl?: string;
  note?: string;
  postedAt?: string;
  lastCheckedAt?: string;
  lastRefreshedAt?: string;
  nextReviewAt?: string;
  manualStatusNote?: string;
};

export type ItemPhoto = {
  id: string;
  alt: string;
  consentGrantedAt: string;
};

export type PriceSource = "agent" | "user" | "connector" | "manual";

export type PricePoint = {
  id: string;
  price: number;
  source: PriceSource;
  reason: string;
  marketplace?: MarketplaceId;
  createdAt: string;
};

export type MetricEntry = {
  id: string;
  marketplace?: MarketplaceId;
  views: number;
  saves: number;
  messages: number;
  listingUrl?: string;
  notes?: string;
  createdAt: string;
};

export type RecommendationType =
  | "price_drop"
  | "repost"
  | "fix_title"
  | "fix_photos"
  | "hold"
  | "refresh_keywords"
  | "refresh_listing"
  | "repost_assisted"
  | "check_messages"
  | "update_manual_stats";
export type RecommendationPriority = "high" | "medium" | "low";
export type RecommendationStatus = "pending" | "accepted" | "dismissed" | "done";

export type Recommendation = {
  id: string;
  itemId: string;
  marketplace?: MarketplaceId;
  type: RecommendationType;
  priority: RecommendationPriority;
  message: string;
  suggestedAction?: { newPrice?: number };
  status: RecommendationStatus;
  fingerprint: string;
  createdAt: string;
};

export type JobStatus = "running" | "success" | "failed";

export type JobRun = {
  id: string;
  jobName: string;
  status: JobStatus;
  startedAt: string;
  finishedAt?: string;
  summary: string;
  error?: string;
  dryRun: boolean;
  createdRecommendations: number;
  updatedRecommendations: number;
};

export type AuditSeverity = "info" | "warning" | "error";
export type AuditArea =
  | "item"
  | "listing"
  | "recommendation"
  | "connector"
  | "price"
  | "privacy"
  | "job";

export type AuditResult = {
  id: string;
  severity: AuditSeverity;
  area: AuditArea;
  message: string;
  entityType: string;
  entityId?: string;
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
};

export type AuditFinding = Omit<AuditResult, "id" | "resolved" | "createdAt" | "resolvedAt">;

export type RecommendationFeedEntry = Recommendation & {
  itemTitle: string;
  itemPrice: number;
};

export type Item = {
  id: string;
  title: string;
  description: string;
  category: string;
  brand: string;
  condition: Condition;
  price: number;
  status: ItemStatus;
  createdAt: string;
  photos: ItemPhoto[];
  listings: Listing[];
  insight: Insight;
  agent?: AgentListing;
  answers?: SellerAnswers;
  priceHistory: PricePoint[];
  metrics: MetricEntry[];
  recommendations: Recommendation[];
};

/**
 * Allowed listing-status transitions (Agent Workflow v1).
 * draft → ready (user approved on review screen)
 * ready → assisted_posted (user tapped Post on an assisted marketplace)
 * ready → active (API connector confirmed publish — real API only)
 * assisted_posted / active → sold | delisted
 * delisted → ready (relist)
 */
export const LISTING_TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  draft: ["ready", "assisted_posted", "active", "delisted"],
  ready: ["assisted_posted", "active", "delisted"],
  assisted_posted: ["sold", "delisted"],
  active: ["sold", "delisted"],
  sold: [],
  delisted: ["ready", "draft"],
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  draft: "draft",
  ready: "ready",
  assisted_posted: "posted by you",
  active: "active",
  sold: "sold",
  delisted: "delisted",
};

export const CONDITION_LABELS: Record<Condition, string> = {
  new: "New",
  like_new: "Like new",
  good: "Good",
  fair: "Fair",
  for_parts: "For parts",
};
