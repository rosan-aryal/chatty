import { redirect } from "next/navigation";

export default function CreateGroupPage() {
  redirect("/chat/groups" as any);
}
