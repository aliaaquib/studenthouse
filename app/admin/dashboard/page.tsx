import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { requireAdmin } from "@/lib/auth/guards";
import { activeRegions, comingSoonRegions, properties, universities } from "@/lib/data";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin("/admin/dashboard");

  return (
    <AdminDashboard
      adminEmail={admin.email}
      initialProperties={properties}
      initialUniversities={universities}
      initialActiveRegions={activeRegions}
      initialComingSoonRegions={comingSoonRegions}
    />
  );
}
