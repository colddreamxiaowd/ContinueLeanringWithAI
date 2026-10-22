import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/public-auth";
import { listFeishuFiles, markFeishuSynced, type FeishuDriveItem } from "@/lib/feishu";
import { dbDelete, dbPatch, dbSelectOne, dbUpsert } from "@/lib/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FolderQueueItem = { token: string; path: string; page_token: string | null };
type SyncJob = {
  id: string;
  user_id: string;
  root_folder_token: string;
  root_folder_name: string;
  status: "running" | "completed" | "failed";
  pending_folders: FolderQueueItem[];
  items_seen: number;
  folders_seen: number;
  pages_processed: number;
  last_error: string | null;
};

function safeSegment(value: string): string {
  return value.replace(/[\/\\]/g, "／").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 240) || "未命名资料";
}

function inferredMime(name: string, existing?: string): string | null {
  if (existing) return existing;
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const types: Record<string, string> = {
    txt: "text/plain", md: "text/markdown", csv: "text/csv",
    pdf: "application/pdf", png: "image/png", jpg: "image/jpeg",
    jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif",
    bmp: "image/bmp", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  };
  return types[ext] || null;
}

function safeFolderQueue(value: unknown): FolderQueueItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is FolderQueueItem =>
    Boolean(entry) &&
    typeof entry === "object" &&
    typeof (entry as FolderQueueItem).token === "string" &&
    typeof (entry as FolderQueueItem).path === "string" &&
    ((entry as FolderQueueItem).page_token === null || typeof (entry as FolderQueueItem).page_token === "string"),
  );
}

async function loadJob(userId: string, jobId: string): Promise<SyncJob | null> {
  const query = new URLSearchParams({
    select: "*",
    user_id: "eq." + userId,
    id: "eq." + jobId,
    limit: "1",
  });
  return dbSelectOne<SyncJob>("sync_jobs", query);
}

async function completeJob(job: SyncJob, userId: string) {
  const query = new URLSearchParams({
    user_id: "eq." + userId,
    id: "eq." + job.id,
  });
  await dbPatch("sync_jobs", query, {
    status: "completed",
    pending_folders: [],
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_error: null,
  });
  // Remove stale entries only after a full successful scan of this selected tree.
  const stale = new URLSearchParams({
    user_id: "eq." + userId,
    root_folder_token: "eq." + job.root_folder_token,
    last_seen_job_id: "neq." + job.id,
  });
  await dbDelete("library_items", stale);
  await markFeishuSynced(userId);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { job_id?: unknown } | null;
  const jobId = typeof body?.job_id === "string" ? body.job_id : "";
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) {
    return NextResponse.json({ error: "JOB_ID_INVALID" }, { status: 400 });
  }

  let job: SyncJob | null = null;
  try {
    job = await loadJob(user.id, jobId);
    if (!job) return NextResponse.json({ error: "JOB_NOT_FOUND" }, { status: 404 });
    if (job.status !== "running") return NextResponse.json({ job });

    const queue = safeFolderQueue(job.pending_folders);
    if (!queue.length) {
      await completeJob(job, user.id);
      return NextResponse.json({ job: { ...job, status: "completed", pending_folders: [] } });
    }
    if (job.pages_processed >= 2000) throw new Error("SYNC_PAGE_LIMIT");

    const current = queue[0];
    const pending = queue.slice(1);
    const page = await listFeishuFiles(user.id, current.token, current.page_token);
    const timestamp = new Date().toISOString();
    const records: Record<string, unknown>[] = [];
    const childFolders: FolderQueueItem[] = [];

    for (const item of page.files as FeishuDriveItem[]) {
      if (!item || typeof item.token !== "string" || !item.token) continue;
      const name = safeSegment(typeof item.name === "string" ? item.name : "");
      const relativePath = current.path + "/" + name;
      const itemType = typeof item.type === "string" ? item.type : "file";
      records.push({
        user_id: user.id,
        source_token: item.token,
        parent_source_token: current.token,
        root_folder_token: job.root_folder_token,
        name,
        item_type: itemType,
        mime_type: inferredMime(name, item.mime_type),
        size_bytes: Number.isFinite(Number(item.size)) ? Number(item.size) : null,
        modified_time: item.modified_time === undefined ? null : String(item.modified_time),
        web_url: typeof item.url === "string" ? item.url : null,
        relative_path: relativePath,
        last_seen_job_id: job.id,
        last_seen_at: timestamp,
        updated_at: timestamp,
      });
      if (itemType === "folder") {
        childFolders.push({ token: item.token, path: relativePath, page_token: null });
      }
    }

    if (records.length) {
      await dbUpsert("library_items", records, "user_id,source_token,root_folder_token");
    }

    if (page.has_more) {
      if (!page.next_page_token) throw new Error("FEISHU_PAGINATION_TOKEN_MISSING");
      pending.unshift({ ...current, page_token: page.next_page_token });
    }
    pending.push(...childFolders);

    const nextPages = job.pages_processed + 1;
    const nextItems = job.items_seen + records.length;
    const nextFolders = job.folders_seen + childFolders.length;
    const nextStatus = pending.length ? "running" : "completed";
    const jobQuery = new URLSearchParams({ user_id: "eq." + user.id, id: "eq." + job.id });
    await dbPatch("sync_jobs", jobQuery, {
      pending_folders: pending,
      pages_processed: nextPages,
      items_seen: nextItems,
      folders_seen: nextFolders,
      status: nextStatus,
      updated_at: timestamp,
      ...(nextStatus === "completed" ? { completed_at: timestamp, last_error: null } : {}),
    });

    if (nextStatus === "completed") {
      const stale = new URLSearchParams({
        user_id: "eq." + user.id,
        root_folder_token: "eq." + job.root_folder_token,
        last_seen_job_id: "neq." + job.id,
      });
      await dbDelete("library_items", stale);
      await markFeishuSynced(user.id);
    }

    return NextResponse.json({
      job: {
        id: job.id,
        status: nextStatus,
        items_seen: nextItems,
        folders_seen: nextFolders,
        pages_processed: nextPages,
        pending_count: pending.length,
      },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SYNC_STEP_FAILED";
    try {
      if (job) {
        const query = new URLSearchParams({ user_id: "eq." + user.id, id: "eq." + job.id });
        await dbPatch("sync_jobs", query, {
          status: "failed",
          last_error: code.slice(0, 80),
          updated_at: new Date().toISOString(),
        });
      }
    } catch {
      // Preserve the primary failure code.
    }
    const status = code === "FEISHU_REAUTH_REQUIRED" ? 401 : code === "FEISHU_PERMISSION_DENIED" ? 403 : 502;
    return NextResponse.json({ error: code }, { status });
  }
}
