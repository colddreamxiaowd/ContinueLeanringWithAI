import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/public-auth";
import { dbSelectOne } from "@/lib/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const { jobId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) {
    return NextResponse.json({ error: "JOB_ID_INVALID" }, { status: 400 });
  }
  try {
    const query = new URLSearchParams({
      select: "id,status,items_seen,folders_seen,pages_processed,last_error,started_at,updated_at,completed_at",
      user_id: "eq." + user.id,
      id: "eq." + jobId,
      limit: "1",
    });
    const job = await dbSelectOne("sync_jobs", query);
    if (!job) return NextResponse.json({ error: "JOB_NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ job });
  } catch {
    return NextResponse.json({ error: "SYNC_STATUS_UNAVAILABLE" }, { status: 503 });
  }
}
