import { NextResponse } from "next/server";
import { setRecommendationStatus } from "@/lib/store";
import type { RecommendationStatus } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

const VALID: RecommendationStatus[] = ["pending", "accepted", "dismissed", "done"];

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = body.status as RecommendationStatus;
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const rec = await setRecommendationStatus(id, status);
  if (!rec) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rec);
}
