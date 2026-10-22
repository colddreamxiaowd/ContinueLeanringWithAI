import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/public-auth";
import { downloadFeishuFile } from "@/lib/feishu";
import { dbSelectOne } from "@/lib/supabase-rest";
import { mimeTypeForName, previewKind, safeFileName } from "@/lib/file-types.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LibraryFile = {
  id: string;
  user_id: string;
  source_token: string;
  name: string;
  item_type: string;
  mime_type: string | null;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "ITEM_ID_INVALID" }, { status: 400 });
  }

  try {
    const query = new URLSearchParams({
      select: "id,user_id,source_token,name,item_type,mime_type",
      id: "eq." + id,
      user_id: "eq." + user.id,
      limit: "1",
    });
    const item = await dbSelectOne<LibraryFile>("library_items", query);
    if (!item) return NextResponse.json({ error: "ITEM_NOT_FOUND" }, { status: 404 });
    if (item.item_type === "folder") {
      return NextResponse.json({ error: "FOLDER_HAS_NO_CONTENT" }, { status: 400 });
    }
    if (item.item_type !== "file") {
      return NextResponse.json(
        { error: "ONLINE_DOCUMENT_OPEN_IN_FEISHU", url: null },
        { status: 415 },
      );
    }

    const upstream = await downloadFeishuFile(user.id, item.source_token);
    const mime = mimeTypeForName(item.name);
    const kind = previewKind(item.name, item.item_type);
    const forceDownload = request.nextUrl.searchParams.get("download") === "1";
    const inline = !forceDownload && ["text", "image", "pdf"].includes(kind);
    const filename = encodeURIComponent(safeFileName(item.name));
    const headers = new Headers({
      "Content-Type": mime,
      "Content-Disposition": (inline ? "inline" : "attachment") + "; filename*=UTF-8''" + filename,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    });
    const length = upstream.headers.get("content-length");
    if (length && /^\d+$/.test(length)) {
      if (Number(length) > 100 * 1024 * 1024) {
        await upstream.body?.cancel();
        return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 413 });
      }
      headers.set("Content-Length", length);
    }
    return new Response(upstream.body, { status: 200, headers });
  } catch (error) {
    const code = error instanceof Error ? error.message : "FILE_READ_FAILED";
    const status = code === "FEISHU_REAUTH_REQUIRED" ? 401 : code === "FEISHU_PERMISSION_DENIED" ? 403 : code === "FEISHU_NOT_CONNECTED" ? 409 : 502;
    return NextResponse.json({ error: code }, { status });
  }
}
