import { NextResponse } from "next/server";
import { getItem, setListingStatus, updateListingMeta } from "@/lib/store";
import {
  LISTING_TRANSITIONS,
  MARKETPLACES,
  type ListingStatus,
  type MarketplaceId,
} from "@/lib/types";

type Params = { params: Promise<{ id: string; marketplace: string }> };

const MARKETPLACE_URL_HOSTS: Record<MarketplaceId, string[]> = {
  ebay: ["ebay.com"],
  etsy: ["etsy.com"],
  facebook: ["facebook.com", "fb.com"],
  craigslist: ["craigslist.org"],
  mercari: ["mercari.com"],
  poshmark: ["poshmark.com"],
};

const VALID_STATUSES: ListingStatus[] = [
  "draft",
  "ready",
  "assisted_posted",
  "active",
  "sold",
  "delisted",
];

function cleanOptionalText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function cleanExternalUrl(value: unknown, marketplace: MarketplaceId): string | undefined | null {
  const raw = cleanOptionalText(value, 500);
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    const allowed = MARKETPLACE_URL_HOSTS[marketplace];
    const isAllowedHost = allowed.some((host) => hostname === host || hostname.endsWith(`.${host}`));
    if (url.protocol !== "https:" || !isAllowedHost) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const { id, marketplace } = await params;
  if (!(MARKETPLACES as readonly string[]).includes(marketplace)) {
    return NextResponse.json({ error: "Unknown marketplace" }, { status: 400 });
  }
  const mp = marketplace as MarketplaceId;
  const body = await req.json().catch(() => ({}));
  const externalUrl = cleanExternalUrl(body.externalUrl, mp);
  if (externalUrl === null) {
    return NextResponse.json(
      { error: "Listing URL must be an HTTPS URL for the selected marketplace." },
      { status: 400 },
    );
  }
  const manualStatusNote = cleanOptionalText(body.manualStatusNote, 300);

  if (body.action === "refreshed") {
    const now = new Date().toISOString();
    const item = await updateListingMeta(id, mp, {
      postedAt: now,
      lastRefreshedAt: now,
      lastCheckedAt: now,
      ...(manualStatusNote ? { manualStatusNote } : {}),
      ...(externalUrl ? { externalUrl } : {}),
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  }

  const status = body.status as ListingStatus;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const item = await getItem(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const current = item.listings.find((l) => l.marketplace === marketplace);
  if (current && !LISTING_TRANSITIONS[current.status].includes(status)) {
    return NextResponse.json(
      { error: `Cannot go from "${current.status}" to "${status}".` },
      { status: 409 },
    );
  }

  const updated = await setListingStatus(id, mp, status);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (manualStatusNote || externalUrl) {
    const now = new Date().toISOString();
    const withMeta = await updateListingMeta(id, mp, {
      ...(status === "assisted_posted" ? { postedAt: now, lastCheckedAt: now } : {}),
      ...(manualStatusNote ? { manualStatusNote } : {}),
      ...(externalUrl ? { externalUrl } : {}),
    });
    if (!withMeta) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(withMeta);
  }

  return NextResponse.json(updated);
}
