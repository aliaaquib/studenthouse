import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { requireAdmin } from "@/lib/auth/guards";
import { getAdminDashboardData } from "@/lib/db/queries";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin("/admin/dashboard");
  const data = await getAdminDashboardData();

  return (
    <AdminDashboard
      adminEmail={admin.email}
      initialProperties={data.properties}
      initialUniversities={data.universities}
      initialActiveRegions={data.activeRegions}
      initialComingSoonRegions={data.comingSoonRegions}
      initialSettings={data.settings}
      initialUsers={data.users}
      initialInquiries={data.inquiries}
      initialFavoritesCount={data.favoritesCount}
    />
  );
}
