import { NextResponse } from "next/server";
import { getItem, setListingStatus, updateListingMeta, upsertListing } from "@/lib/store";
import {
  LISTING_TRANSITIONS,
  MARKETPLACES,
  type ListingStatus,
  type MarketplaceId,
} from "@/lib/types";

type Params = { params: Promise<{ id: string; marketplace: string }> };

const VALID_STATUSES: ListingStatus[] = [
  "draft",
  "ready",
  "assisted_posted",
  "active",
  "sold",
  "delisted",
];

export async function PATCH(req: Request, { params }: Params) {
  const { id, marketplace } = await params;
  if (!(MARKETPLACES as readonly string[]).includes(marketplace)) {
    return NextResponse.json({ error: "Unknown marketplace" }, { status: 400 });
  }
  const mp = marketplace as MarketplaceId;
  const body = await req.json().catch(() => ({}));

  if (body.action === "mark_posted") {
    const existing = await getItem(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const item = await upsertListing(id, {
      marketplace: mp,
      mode: "assisted",
      status: "assisted_posted",
      postedAt: new Date().toISOString(),
      externalUrl:
        typeof body.externalUrl === "string" && body.externalUrl
          ? body.externalUrl
          : undefined,
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  }

  if (body.action === "refreshed") {
    const now = new Date().toISOString();
    const item = await updateListingMeta(id, mp, {
      postedAt: now,
      lastRefreshedAt: now,
      lastCheckedAt: now,
      ...(typeof body.manualStatusNote === "string" && body.manualStatusNote
        ? { manualStatusNote: body.manualStatusNote }
        : {}),
      ...(typeof body.externalUrl === "string" && body.externalUrl
        ? { externalUrl: body.externalUrl }
        : {}),
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
  return NextResponse.json(updated);
}
