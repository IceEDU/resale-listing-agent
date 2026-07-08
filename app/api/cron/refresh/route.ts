import { NextResponse } from "next/server";
import { runJob } from "@/lib/jobs/runner";

/**
 * Scheduled entry point (Vercel Cron or any external cron). Only generates
 * recommendations and audit findings; it never posts, reprices, or touches a
 * marketplace. Those actions always require the user to accept a suggestion.
 *
 * Auth: when CRON_SECRET is set, requires "Authorization: Bearer <secret>"
 * (Vercel Cron sends this automatically). Without a secret it only runs in
 * development, so a production deployment cannot be triggered anonymously.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (req.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 401 },
    );
  }

  const runs = [
    await runJob("check-stale-listings"),
    await runJob("refresh-recommendations"),
    await runJob("self-audit"),
  ];

  return NextResponse.json({
    ok: runs.every((r) => r.status === "success"),
    runs: runs.map((r) => ({ jobName: r.jobName, status: r.status, summary: r.summary })),
    timestamp: new Date().toISOString(),
  });
}
