import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/public-auth";
import { listFeishuFiles } from "@/lib/feishu";
import { dbRequest, dbUpsert } from "@/lib/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SyncJob = {
  id: string;
  user_id: string;
  root_folder_token: string;
  root_folder_name: string;
  status: string;
};

function safeSegment(value: string): string {
  return value.replace(/[\/\\]/g, "／").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 240) || "未命名资料";
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    folder_token?: unknown;
    folder_name?: unknown;
  } | null;
  const folderToken = typeof body?.folder_token === "string" ? body.folder_token.trim() : "";
  const folderName = typeof body?.folder_name === "string" ? safeSegment(body.folder_name) : "";
  if (!folderToken || folderToken.length > 500 || !folderName) {
    return NextResponse.json({ error: "FOLDER_REQUIRED" }, { status: 400 });
  }

  try {
    // Verify the selected folder is readable before creating a persistent job.
    await listFeishuFiles(user.id, folderToken, null);
    const inserted = await dbRequest<SyncJob[]>("sync_jobs", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        user_id: user.id,
        root_folder_token: folderToken,
        root_folder_name: folderName,
        status: "running",
        pending_folders: [{ token: folderToken, path: folderName, page_token: null }],
        items_seen: 0,
        folders_seen: 0,
        pages_processed: 0,
      }),
    });
    const job = Array.isArray(inserted) ? inserted[0] : null;
    if (!job?.id) throw new Error("SYNC_JOB_CREATE_FAILED");

    await dbUpsert(
      "library_items",
      {
        user_id: user.id,
        source_token: folderToken,
        parent_source_token: null,
        root_folder_token: folderToken,
        name: folderName,
        item_type: "folder",
        mime_type: null,
        size_bytes: null,
        modified_time: null,
        web_url: null,
        relative_path: folderName,
        last_seen_job_id: job.id,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      "user_id,source_token,root_folder_token",
    );
    return NextResponse.json({ job_id: job.id, status: job.status }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "FEISHU_NOT_CONNECTED" ? 409 : code === "FEISHU_REAUTH_REQUIRED" ? 401 : code === "FEISHU_PERMISSION_DENIED" ? 403 : 502;
    return NextResponse.json({ error: code || "SYNC_START_FAILED" }, { status });
  }
}
