import { useMemo } from "react";

import type { DashboardPayload } from "@/lib/api";
import { usePlantAnalytics, type PlantAnalytics } from "@/hooks/usePlantAnalytics";
import { siteToProjectDashboardShape } from "@/lib/siteCmsMonitor";

/** Site analytics via the same export/KPI builders used by plant CMS. */
export function useSiteAnalytics(
  data: DashboardPayload | null,
): PlantAnalytics | null {
  const shaped = useMemo(
    () => (data ? siteToProjectDashboardShape(data) : null),
    [data],
  );
  return usePlantAnalytics(shaped);
}
