import { NextResponse } from "next/server";
import { refreshInsight } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const insight = await refreshInsight(id);
  if (!insight) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(insight);
}
