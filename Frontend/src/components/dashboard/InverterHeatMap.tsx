import { useMemo, useState } from "react";

import {
  CMS_STATUS_META,
  type CmsInverterCell,
  type CmsInvStatus,
} from "@/lib/cmsMonitor";
import { downloadCsv, type DateRangeValue } from "@/lib/chartActions";
import { usePanelFullscreen } from "@/hooks/usePanelFullscreen";
import { ChartToolbar } from "./ChartToolbar";
import { DateRangePicker } from "./DateRangePicker";
import { panelClass, sectionTitleClass } from "./panel";

type Density = "small" | "summary" | "full";

type InverterHeatMapProps = {
  inverters: CmsInverterCell[];
  density?: Density;
  title?: string;
  showDensityToggle?: boolean;
  dateRange?: DateRangeValue;
  onDateRangeChange?: (next: DateRangeValue) => void;
};

export function InverterHeatMap({
  inverters,
  density: densityProp,
  title = "Inverter Heat Map",
  showDensityToggle = true,
  dateRange,
  onDateRangeChange,
}: InverterHeatMapProps) {
  const [filter, setFilter] = useState<CmsInvStatus | "all">("all");
  const [density, setDensity] = useState<Density>(densityProp ?? "summary");
  const [selected, setSelected] = useState<string | null>(null);
  const { ref, active, toggle } = usePanelFullscreen();

  const filtered = useMemo(
    () =>
      filter === "all"
        ? inverters
        : inverters.filter((inv) => inv.status === filter),
    [inverters, filter],
  );

  const selectedInv = inverters.find((i) => i.id === selected);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: inverters.length };
    for (const inv of inverters) {
      c[inv.status] = (c[inv.status] ?? 0) + 1;
    }
    return c;
  }, [inverters]);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`${panelClass} flex min-h-0 flex-col ${active ? "overflow-auto bg-page p-3" : ""}`}
    >
      <div className="flex items-center gap-3 border-b border-edge px-3 py-2.5">
        <h3 className={`${sectionTitleClass} shrink-0`}>{title}</h3>
        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-1.5">
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label={`All (${counts.all})`}
          />
          {(
            ["running", "error", "stopped", "sleep"] as CmsInvStatus[]
          ).map((status) => (
            <FilterChip
              key={status}
              active={filter === status}
              onClick={() => setFilter(status)}
              label={CMS_STATUS_META[status].label}
              color={CMS_STATUS_META[status].color}
              count={counts[status] ?? 0}
            />
          ))}
          <ChartToolbar
            onExport={() =>
              downloadCsv("inverter-heatmap", [
                ["Inverter", "Status", "Power kW", "Deviation %"],
                ...filtered.map((inv) => [
                  inv.label,
                  CMS_STATUS_META[inv.status].label,
                  inv.powerKw.toFixed(2),
                  inv.deviationPct.toFixed(2),
                ]),
              ])
            }
            onFullscreen={toggle}
            fullscreen={active}
          >
            {dateRange && onDateRangeChange ? (
              <DateRangePicker
                value={dateRange}
                onChange={onDateRangeChange}
                compact
              />
            ) : null}
          </ChartToolbar>
        </div>
      </div>

      {showDensityToggle ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-3 py-2">
          <div className="inline-flex rounded-md border border-edge p-0.5">
            {(
              [
                ["small", "Small Grid"],
                ["summary", "Summary Cards"],
                ["full", "Full Cards"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setDensity(id)}
                className={[
                  "rounded px-2.5 py-1 text-[11px] transition-colors",
                  density === id
                    ? "bg-fill-strong text-fg"
                    : "text-muted hover:text-fg",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
          <Legend />
        </div>
      ) : (
        <div className="flex justify-end border-b border-edge px-3 py-2">
          <Legend />
        </div>
      )}

      <div className="flex-1 overflow-auto p-3">
        {density === "small" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(18px,1fr))] gap-1.5">
            {filtered.map((inv) => (
              <button
                key={inv.id}
                type="button"
                title={`${inv.label}: ${inv.powerKw.toFixed(2)} kW`}
                onClick={() => setSelected(inv.id)}
                className={[
                  "aspect-square rounded-md transition-transform hover:scale-110",
                  selected === inv.id ? "ring-2 ring-accent" : "",
                ].join(" ")}
                style={{ backgroundColor: CMS_STATUS_META[inv.status].color }}
              />
            ))}
          </div>
        ) : density === "summary" ? (
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {filtered.map((inv) => (
              <button
                key={inv.id}
                type="button"
                onClick={() => setSelected(inv.id)}
                className={[
                  "flex min-h-[52px] items-stretch overflow-hidden rounded-md border border-edge bg-fill/40 text-left transition-colors hover:bg-fill",
                  selected === inv.id ? "ring-1 ring-accent" : "",
                ].join(" ")}
              >
                <span
                  className="w-1 shrink-0"
                  style={{ backgroundColor: CMS_STATUS_META[inv.status].color }}
                />
                <span className="flex min-w-0 flex-1 flex-col justify-center px-2 py-1.5">
                  <span className="truncate text-[10px] text-muted">
                    {inv.label}
                  </span>
                  <span className="truncate text-xs font-medium tabular-nums text-fg">
                    {inv.powerKw.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    kW
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead>
                <tr className="border-b border-edge text-[10px] uppercase tracking-wide text-muted">
                  <th className="px-2 py-2 font-medium">Inverter</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Power</th>
                  <th className="px-2 py-2 font-medium">Deviation</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelected(inv.id)}
                    className={[
                      "cursor-pointer border-b border-edge/70 hover:bg-fill/50",
                      selected === inv.id ? "bg-fill/60" : "",
                    ].join(" ")}
                  >
                    <td className="px-2 py-2">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-sm"
                          style={{
                            backgroundColor: CMS_STATUS_META[inv.status].color,
                          }}
                        />
                        {inv.label}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-secondary">
                      {CMS_STATUS_META[inv.status].label}
                    </td>
                    <td className="px-2 py-2 tabular-nums text-fg">
                      {inv.powerKw.toFixed(2)} kW
                    </td>
                    <td
                      className={[
                        "px-2 py-2 tabular-nums",
                        inv.deviationPct >= 0 ? "text-success" : "text-danger",
                      ].join(" ")}
                    >
                      {inv.deviationPct >= 0 ? "+" : ""}
                      {inv.deviationPct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedInv ? (
        <div className="border-t border-edge px-3 py-2 text-[11px] text-secondary">
          <span className="font-medium text-fg">{selectedInv.label}</span>
          {" · "}
          {selectedInv.powerKw.toFixed(2)} kW
          {" · "}
          {CMS_STATUS_META[selectedInv.status].label}
          {" · Δ "}
          {selectedInv.deviationPct.toFixed(1)}%
        </div>
      ) : null}
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  color,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] transition-colors",
        active ? "bg-fill-strong text-fg" : "text-muted hover:bg-fill hover:text-fg",
      ].join(" ")}
    >
      {color ? (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      ) : null}
      {label}
      {count !== undefined ? (
        <span className="tabular-nums text-subtle">{count}</span>
      ) : null}
    </button>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted">
      {(
        [
          ["error", CMS_STATUS_META.error],
          ["running", CMS_STATUS_META.running],
          ["stopped", CMS_STATUS_META.stopped],
          ["offline", CMS_STATUS_META.offline],
        ] as const
      ).map(([key, meta]) => (
        <span key={key} className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: meta.color }}
          />
          {meta.legend}
        </span>
      ))}
    </div>
  );
}
