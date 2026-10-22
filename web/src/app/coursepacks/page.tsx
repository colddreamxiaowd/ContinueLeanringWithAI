import {redirect} from "next/navigation";
import {AppShell} from "@/components/app-shell";
import {getCurrentUser} from "@/lib/public-auth";
import {CoursePackClient} from "@/components/coursepack-client";
export const dynamic="force-dynamic";
export const metadata={title:"私人课程 · 知序 Learning Hub"};
export default async function CoursePacksPage(){
  const user=await getCurrentUser();
  if(!user)redirect("/login?next=%2Fcoursepacks");
  return <AppShell><CoursePackClient/></AppShell>;
}
