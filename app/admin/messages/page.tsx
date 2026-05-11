import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminMessagesPage() {
  await requireAdmin("/admin/messages");
  redirect("/admin/dashboard");
}
