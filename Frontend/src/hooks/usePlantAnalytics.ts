import { useMemo } from "react";

import type { ProjectDashboardPayload } from "@/lib/api";
import { readDataEntryState } from "@/lib/dataEntryStore";
import {
  buildExportMetrics,
  buildKpiAnalytics,
  buildPerformanceGrid,
  type ExportMetricsInput,
  type ExportPeriodMetrics,
  type KpiGaugeMetric,
  type KpiSeriesPoint,
  type PerformanceGridData,
} from "@/lib/exportMetrics";

function parseOptionalNumber(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export type PlantAnalytics = {
  exportMetrics: ExportPeriodMetrics[];
  kpiAnalytics: { gauges: KpiGaugeMetric[]; series: KpiSeriesPoint[] };
  performanceGrid: PerformanceGridData;
};

export function usePlantAnalytics(
  data: ProjectDashboardPayload | null,
  refreshKey = 0,
): PlantAnalytics | null {
  return useMemo(() => {
    if (!data) return null;

    const intake = readDataEntryState(data.project.id)?.values.dashboard;
    const input: ExportMetricsInput = {
      plantName: data.project.name,
      capacityMw: data.project.capacityMw,
      kpis: data.kpis,
      generationSeries: data.generationSeries,
      expectedAnnualMwh: parseOptionalNumber(
        intake?.expectedAnnualGenerationMwh,
      ),
      prTargetPct: parseOptionalNumber(intake?.performanceRatioTarget),
    };

    return {
      exportMetrics: buildExportMetrics(input),
      kpiAnalytics: buildKpiAnalytics(input),
      performanceGrid: buildPerformanceGrid(input),
    };
  }, [data, refreshKey]);
}
