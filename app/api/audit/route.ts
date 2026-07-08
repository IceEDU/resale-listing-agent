import { NextResponse } from "next/server";
import { listAuditResults } from "@/lib/store";

export async function GET() {
  const results = await listAuditResults(100);
  return NextResponse.json({
    unresolved: results.filter((r) => !r.resolved),
    recent: results,
  });
}
