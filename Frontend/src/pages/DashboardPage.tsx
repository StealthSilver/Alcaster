import { Dashboard, DashboardShell } from "@/components/dashboard";
import { dashboardData } from "@/data/dashboard";

export function DashboardPage() {
  return (
    <DashboardShell user={dashboardData.user} dateLabel={dashboardData.dateLabel}>
      <Dashboard data={dashboardData} />
    </DashboardShell>
  );
}
