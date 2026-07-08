import { NextResponse } from "next/server";
import { API_CONNECTORS, isAssisted, toDraftListing } from "@/lib/connectors";
import { getItem, upsertListing } from "@/lib/store";
import { MARKETPLACES, type MarketplaceId } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const requested: MarketplaceId[] = Array.isArray(body.marketplaces)
    ? body.marketplaces.filter((m: string) =>
        (MARKETPLACES as readonly string[]).includes(m),
      )
    : [];
  if (requested.length === 0) {
    return NextResponse.json({ error: "Pick at least one marketplace." }, { status: 400 });
  }

  const results = [];
  for (const marketplace of requested) {
    if (isAssisted(marketplace)) {
      await upsertListing(id, { marketplace, mode: "assisted", status: "draft" });
      results.push({
        marketplace,
        mode: "assisted" as const,
        ok: true,
        note: "Draft prepared. Open it, copy the text, and tap Post on the marketplace yourself.",
      });
      continue;
    }
    const connector = API_CONNECTORS[marketplace as "ebay" | "etsy"];
    const result = await connector.createListing(toDraftListing(item));
    await upsertListing(id, {
      marketplace,
      mode: "api",
      status: result.status,
      note: result.note,
      postedAt: result.ok ? new Date().toISOString() : undefined,
    });
    results.push({ marketplace, mode: "api" as const, ok: result.ok, note: result.note });
  }

  return NextResponse.json({ results });
}
