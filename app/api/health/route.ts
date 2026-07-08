import { NextResponse } from "next/server";
import pkg from "@/package.json";
import { prisma } from "@/lib/db";
import { listJobRuns, storageMode } from "@/lib/store";

export async function GET() {
  const mode = storageMode();
  let database: "ok" | "unreachable" | "not used (mock mode)" = "not used (mock mode)";
  if (mode === "prisma") {
    try {
      await prisma().$queryRaw`SELECT 1`;
      database = "ok";
    } catch {
      database = "unreachable";
    }
  }
  const [lastJobRun] = await listJobRuns(1).catch(() => [undefined]);
  const ok = mode === "mock" || database === "ok";
  return NextResponse.json(
    {
      ok,
      mode,
      database,
      lastJobRun: lastJobRun
        ? {
            jobName: lastJobRun.jobName,
            status: lastJobRun.status,
            finishedAt: lastJobRun.finishedAt ?? null,
            summary: lastJobRun.summary,
          }
        : null,
      version: pkg.version,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
