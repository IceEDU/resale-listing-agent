import { NextResponse } from "next/server";
import { listRecommendations, refreshRecommendations } from "@/lib/store";

export async function GET() {
  return NextResponse.json(await listRecommendations());
}

export async function POST() {
  const pending = await refreshRecommendations();
  return NextResponse.json({ pending });
}
