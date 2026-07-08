import { NextResponse } from "next/server";

/**
 * Photo upload stub. In production this accepts multipart uploads, verifies
 * the consent flag, strips EXIF/GPS metadata, and writes to private blob
 * storage (DESIGN.md §7). The MVP scaffold keeps photos on the device and
 * only validates the consent contract.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { consent = false, count = 0 } = body as { consent?: boolean; count?: number };

  if (!consent) {
    return NextResponse.json(
      { error: "Photos are never stored without your consent." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    stored: 0,
    requested: count,
    note: "Stub: would strip EXIF and write to private blob storage.",
  });
}
