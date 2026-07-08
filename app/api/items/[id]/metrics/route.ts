import { NextResponse } from "next/server";
import { addMetric } from "@/lib/store";
import { MARKETPLACES, type MarketplaceId } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const marketplace =
    typeof body.marketplace === "string" &&
    (MARKETPLACES as readonly string[]).includes(body.marketplace)
      ? (body.marketplace as MarketplaceId)
      : undefined;

  const item = await addMetric(id, {
    marketplace,
    views: Math.max(0, Number(body.views) || 0),
    saves: Math.max(0, Number(body.saves) || 0),
    messages: Math.max(0, Number(body.messages) || 0),
    listingUrl: typeof body.listingUrl === "string" && body.listingUrl ? body.listingUrl : undefined,
    notes: typeof body.notes === "string" && body.notes ? body.notes : undefined,
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}
