import { PageChrome, PageIntro } from "@/components/sections/page-chrome";
import { StudentDashboard } from "@/components/sections/student-dashboard";
import { properties } from "@/lib/data";

export default function DashboardPage() {
  return (
    <PageChrome>
      <PageIntro title="Student dashboard" copy="Track saved apartments, tours, landlord messages, roommate preferences, and booking requests in one calm workspace." />
      <StudentDashboard properties={properties} />
    </PageChrome>
  );
}
