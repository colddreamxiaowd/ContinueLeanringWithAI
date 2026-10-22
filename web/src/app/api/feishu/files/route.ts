import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/public-auth";
import { listFeishuFiles } from "@/lib/feishu";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const folderToken = searchParams.get("folder_token");
  const pageToken = searchParams.get("page_token");
  if ((folderToken && folderToken.length > 500) || (pageToken && pageToken.length > 1000)) {
    return NextResponse.json({ error: "REQUEST_INVALID" }, { status: 400 });
  }

  try {
    const result = await listFeishuFiles(user.id, folderToken, pageToken);
    return NextResponse.json({
      files: result.files.map((item) => ({
        token: item.token,
        name: item.name || "未命名资料",
        type: item.type || "file",
        mime_type: item.mime_type || null,
        size: Number.isFinite(Number(item.size)) ? Number(item.size) : null,
        modified_time: item.modified_time ?? null,
        url: item.url || null,
      })),
      has_more: result.has_more,
      next_page_token: result.next_page_token,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "FEISHU_NOT_CONNECTED" ? 409 : code === "FEISHU_REAUTH_REQUIRED" ? 401 : code === "FEISHU_PERMISSION_DENIED" ? 403 : 502;
    return NextResponse.json({ error: code || "FEISHU_API_FAILED" }, { status });
  }
}
