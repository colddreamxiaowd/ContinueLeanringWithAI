import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/public-auth";
import { downloadFeishuFile } from "@/lib/feishu";
import { dbSelectOne } from "@/lib/supabase-rest";
import { extractOfficeSections } from "@/lib/office-reader.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 15 * 1024 * 1024;

type PrivateFile = { name: string; source_token: string; item_type: string };

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "ITEM_ID_INVALID" }, { status: 400 });
  }

  try {
    const item = await dbSelectOne<PrivateFile>("library_items", new URLSearchParams({
      select: "name,source_token,item_type", id: "eq." + id,
      user_id: "eq." + user.id, limit: "1",
    }));
    if (!item) return NextResponse.json({ error: "ITEM_NOT_FOUND" }, { status: 404 });
    if (item.item_type !== "file" || !/\.(pptx|docx|xlsx)$/i.test(item.name)) {
      return NextResponse.json({ error: "OFFICE_TYPE_UNSUPPORTED" }, { status: 415 });
    }
    const upstream = await downloadFeishuFile(user.id, item.source_token);
    const body = upstream.body;
    if (!body) throw new Error("FEISHU_DOWNLOAD_FAILED");
    const chunks: Buffer[] = [];
    let total = 0;
    for await (const chunk of body) {
      const bytes = Buffer.from(chunk);
      total += bytes.length;
      if (total > MAX_BYTES) {
        await body.cancel().catch(() => {});
        return NextResponse.json({ error: "OFFICE_SIZE_UNSUPPORTED" }, { status: 413 });
      }
      chunks.push(bytes);
    }
    const result = extractOfficeSections(Buffer.concat(chunks), item.name);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "OFFICE_READ_FAILED";
    const status = code === "OFFICE_TYPE_UNSUPPORTED" ? 415
      : code === "OFFICE_SIZE_UNSUPPORTED" ? 413
      : code === "OFFICE_FILE_INVALID" || code === "OFFICE_NO_READABLE_CONTENT" ? 422
      : code === "FEISHU_REAUTH_REQUIRED" ? 401
      : code === "FEISHU_PERMISSION_DENIED" ? 403 : 502;
    return NextResponse.json({ error: code }, { status });
  }
}
