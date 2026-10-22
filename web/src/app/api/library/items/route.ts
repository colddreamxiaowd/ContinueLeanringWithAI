import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/public-auth";
import { dbSelectAll } from "@/lib/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LibraryItem = {
  id: string;
  source_token: string;
  parent_source_token: string | null;
  root_folder_token: string;
  name: string;
  item_type: string;
  mime_type: string | null;
  size_bytes: number | null;
  modified_time: string | null;
  web_url: string | null;
  relative_path: string;
  last_seen_at: string;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  try {
    const query = new URLSearchParams({
      select: "id,source_token,parent_source_token,root_folder_token,name,item_type,mime_type,size_bytes,modified_time,web_url,relative_path,last_seen_at",
      user_id: "eq." + user.id,
      order: "relative_path.asc,name.asc",
    });
    const items = await dbSelectAll<LibraryItem>("library_items", query);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "LIBRARY_UNAVAILABLE" }, { status: 503 });
  }
}
