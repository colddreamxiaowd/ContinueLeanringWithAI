import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/public-auth";
import { getFeishuConnectionSummary } from "@/lib/feishu";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  try {
    return NextResponse.json(await getFeishuConnectionSummary(user.id));
  } catch {
    return NextResponse.json({ error: "SERVER_NOT_CONFIGURED" }, { status: 503 });
  }
}
