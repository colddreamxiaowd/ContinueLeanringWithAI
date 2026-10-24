import {redirect} from "next/navigation";
import {getCurrentUser} from "@/lib/public-auth";
import CoursePlanStudio from "@/components/CoursePlanStudio";
export const dynamic="force-dynamic";
export const metadata={title:"同一份资料 · 三种课程 · 知序 Learning Hub"};
export default async function CoursePlanPage(){
 const user=await getCurrentUser();
 if(!user)redirect("/login?next=%2Flearn%2Fplans");
 return <CoursePlanStudio ownerId={user.id}/>;
}
