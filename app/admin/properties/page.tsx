import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminPropertiesPage() {
  await requireAdmin("/admin/properties");
  redirect("/admin/dashboard");
}
