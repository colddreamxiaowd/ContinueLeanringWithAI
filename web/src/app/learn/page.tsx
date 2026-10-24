import {redirect} from "next/navigation";
import {getCurrentUser} from "@/lib/public-auth";
import PrivateLearningClient from "./PrivateLearningClient";

export const dynamic="force-dynamic";
export const metadata={title:"私人课程学习 · 知序 Learning Hub"};

export default async function PrivateLearningPage(){
  const user=await getCurrentUser();
  if(!user)redirect("/login?next=%2Flearn");
  return <PrivateLearningClient/>;
}
