import { NextResponse } from "next/server";
import { getItem, updateItem } from "@/lib/store";
import type { Item } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Partial<Item>;
  const allowed: Partial<Item> = {};
  if (typeof body.title === "string") allowed.title = body.title;
  if (typeof body.description === "string") allowed.description = body.description;
  if (typeof body.category === "string") allowed.category = body.category;
  if (typeof body.brand === "string") allowed.brand = body.brand;
  if (typeof body.condition === "string") allowed.condition = body.condition;
  if (typeof body.price === "number" && body.price > 0) allowed.price = body.price;

  const item = await updateItem(id, allowed);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}
