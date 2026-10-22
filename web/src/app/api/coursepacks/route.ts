import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/public-auth";
import { dbRequest } from "@/lib/supabase-rest";
import { validateCoursePack } from "@/lib/coursepack.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});
  try {
    const query = new URLSearchParams({
      select:"id,title,pack_version,pack,created_at",
      user_id:"eq."+user.id,
      order:"created_at.desc",
      limit:"40",
    });
    const courses = await dbRequest("coursepacks?"+query.toString());
    return NextResponse.json({courses});
  } catch {
    return NextResponse.json({error:"COURSEPACK_LIST_FAILED"},{status:503});
  }
}
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});
  const raw = await request.text();
  if (raw.length > 240000)
    return NextResponse.json({error:"COURSEPACK_TOO_LARGE"},{status:413});
  let input: unknown;
  try { input=JSON.parse(raw); }
  catch { return NextResponse.json({error:"INVALID_JSON"},{status:400}); }
  const pack = (input && typeof input==="object" && "pack" in input)
    ? (input as {pack:unknown}).pack : input;
  const verdict = validateCoursePack(pack);
  if (!verdict.ok) return NextResponse.json({error:"INVALID_COURSEPACK",details:verdict.errors},{status:400});
  const valid = pack as {title:string;version:number};
  try {
    const inserted = await dbRequest<Array<{id:string}>>("coursepacks",{
      method:"POST", headers:{Prefer:"return=representation"},
      body:JSON.stringify({
        user_id:user.id,title:valid.title,pack_version:valid.version,
        visibility:"private",pack
      })
    });
    if (!inserted?.[0]?.id) throw new Error("COURSEPACK_INSERT_FAILED");
    return NextResponse.json({id:inserted[0].id,visibility:"private"},{status:201});
  } catch {
    return NextResponse.json({error:"COURSEPACK_SAVE_FAILED"},{status:503});
  }
}
