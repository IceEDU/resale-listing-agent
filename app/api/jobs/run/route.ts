import { NextResponse } from "next/server";
import { isJobName, runJob } from "@/lib/jobs/runner";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const job = String(body.job ?? "");
  const dryRun = Boolean(body.dryRun);
  if (!isJobName(job)) {
    return NextResponse.json({ error: `Unknown job "${job}"` }, { status: 400 });
  }
  const run = await runJob(job, dryRun);
  return NextResponse.json(run);
}
