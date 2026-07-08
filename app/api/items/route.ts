import { NextResponse } from "next/server";
import { createItem, listItems } from "@/lib/store";

export async function GET() {
  return NextResponse.json(await listItems());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { hint = "", photoCount = 0, consent = false, answers } = body as {
    hint?: string;
    photoCount?: number;
    consent?: boolean;
    answers?: {
      condition?: "new" | "open_box" | "used";
      missingParts?: string;
      paidPrice?: number;
      goal?: "fast_sale" | "max_profit" | "balanced";
    };
  };

  if (!consent) {
    return NextResponse.json(
      { error: "Photo analysis needs your consent first." },
      { status: 400 },
    );
  }
  if (!photoCount || photoCount < 1) {
    return NextResponse.json({ error: "Add at least one photo." }, { status: 400 });
  }

  const item = await createItem({
    hint: String(hint),
    photoCount: Number(photoCount),
    answers,
  });
  return NextResponse.json(item, { status: 201 });
}
