import { Dashboard, DashboardShell } from "@/components/dashboard";
import { dashboardData } from "@/data/dashboard";
import { createPrivatePageMetadata } from "@/lib/metadata";

export const metadata = createPrivatePageMetadata("Dashboard");

export default function DashboardPage() {
  return (
    <DashboardShell user={dashboardData.user} dateLabel={dashboardData.dateLabel}>
      <Dashboard data={dashboardData} />
    </DashboardShell>
  );
}
