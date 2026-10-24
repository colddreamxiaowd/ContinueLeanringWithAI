import {redirect} from "next/navigation";
import {getCurrentUser} from "@/lib/public-auth";
import MathWorkbench from "@/components/MathWorkbench";
export const dynamic="force-dynamic";
export const metadata={title:"我的数学探索 · 知序"};
export default async function PrivateMathLab(){
  const user=await getCurrentUser();
  if(!user)redirect("/login?next=%2Flearn%2Fmath");
  return <MathWorkbench accountMode ownerId={user.id}/>;
}
