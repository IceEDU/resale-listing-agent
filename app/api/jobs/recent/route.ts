import { NextResponse } from "next/server";
import { listJobs } from "@/lib/jobs/runner";
import { listJobRuns } from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    jobs: listJobs(),
    runs: await listJobRuns(20),
  });
}
