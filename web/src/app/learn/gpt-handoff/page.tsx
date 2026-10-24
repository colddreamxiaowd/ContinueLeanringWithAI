import {redirect} from "next/navigation";
import {AppShell} from "@/components/app-shell";
import {getCurrentUser} from "@/lib/public-auth";
import ChatGptCourseHandoff from "@/components/ChatGptCourseHandoff";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const metadata={title:"ChatGPT 网页版制课交接 · 知序 Learning Hub"};
export default async function ChatGptCourseHandoffPage(){
 const user=await getCurrentUser();
 if(!user)redirect("/login?next=%2Flearn%2Fgpt-handoff");
 return <AppShell><ChatGptCourseHandoff/></AppShell>;
}
