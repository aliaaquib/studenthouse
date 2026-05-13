import { PageChrome, PageIntro } from "@/components/sections/page-chrome";
import { StudentDashboard } from "@/components/sections/student-dashboard";
import { requireUser } from "@/lib/auth/guards";
import { getStudentDashboardData } from "@/lib/db/queries";

export default async function DashboardPage() {
  await requireUser("/dashboard");
  const data = await getStudentDashboardData();

  return (
    <PageChrome>
      <PageIntro title="Student dashboard" copy="Track saved apartments, tours, landlord messages, roommate preferences, and booking requests in one calm workspace." />
      <StudentDashboard
        savedProperties={data.savedProperties}
        recentSearches={data.recentSearches}
        inquiryHistory={data.inquiryHistory}
        viewedProperties={data.viewedProperties}
      />
    </PageChrome>
  );
}
