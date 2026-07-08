import { NextResponse } from "next/server";
import { runJob } from "@/lib/jobs/runner";
import { listAuditResults } from "@/lib/store";

export async function POST() {
  const run = await runJob("self-audit");
  const results = await listAuditResults(100);
  return NextResponse.json({
    run,
    unresolved: results.filter((r) => !r.resolved),
  });
}
