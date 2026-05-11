import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminUniversitiesPage() {
  await requireAdmin("/admin/universities");
  redirect("/admin/dashboard");
}
