import { AgentDashboard } from "@/components/dashboard/agent-dashboard";
import { requireAgent } from "@/lib/auth/guards";
import { getAgentDashboardData, getUniversities } from "@/lib/db/queries";

export default async function AgentDashboardPage() {
  const session = await requireAgent("/agent");
  const [agentData, universities] = await Promise.all([getAgentDashboardData(), getUniversities()]);

  return (
    <AgentDashboard
      session={session}
      initialProperties={agentData.properties}
      initialUniversities={universities}
      initialInquiries={agentData.inquiries}
    />
  );
}
