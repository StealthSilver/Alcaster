import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import type { PerformanceGridData } from "@/lib/exportMetrics";
import { downloadCsv, type DateRangeValue } from "@/lib/chartActions";
import { usePanelFullscreen } from "@/hooks/usePanelFullscreen";
import { ChartToolbar } from "./ChartToolbar";
import { DateRangePicker } from "./DateRangePicker";
import { panelClass, sectionTitleClass } from "./panel";

type PerformanceGridProps = {
  data: PerformanceGridData;
  dateRange?: DateRangeValue;
  onDateRangeChange?: (next: DateRangeValue) => void;
};

function prColor(pr: number, median: boolean, medianPr: number): string {
  const value = median ? pr - medianPr + 80 : pr;
  if (value >= 88) return "rgba(42, 157, 110, 0.85)";
  if (value >= 80) return "rgba(42, 157, 110, 0.55)";
  if (value >= 72) return "rgba(230, 116, 10, 0.55)";
  if (value >= 64) return "rgba(230, 116, 10, 0.75)";
  return "rgba(192, 75, 69, 0.7)";
}

export function PerformanceGrid({
  data,
  dateRange,
  onDateRangeChange,
}: PerformanceGridProps) {
  const [medianMode, setMedianMode] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(
    data.cells[0]?.id ?? null,
  );
  const { ref, active, toggle } = usePanelFullscreen();

  const cellMap = useMemo(() => {
    const map = new Map<string, (typeof data.cells)[number]>();
    for (const cell of data.cells) {
      map.set(`${cell.region}|${cell.block}`, cell);
    }
    return map;
  }, [data.cells]);

  const selected = data.cells.find((c) => c.id === selectedId) ?? data.cells[0];

  const tableRows = useMemo(() => {
    const byRegion = new Map<string, typeof data.cells>();
    for (const cell of data.cells) {
      const list = byRegion.get(cell.region) ?? [];
      list.push(cell);
      byRegion.set(cell.region, list);
    }
    return [...byRegion.entries()].map(([region, cells]) => {
      const n = cells.length || 1;
      const sum = (key: keyof (typeof cells)[number]) =>
        cells.reduce((acc, c) => acc + (c[key] as number), 0);
      return {
        region,
        energyMwh: sum("energyMwh"),
        cufPct: sum("cufPct") / n,
        paPct: sum("paPct") / n,
        gaPct: sum("gaPct") / n,
        prPct: sum("prPct") / n,
        yieldMwhPerMwp: sum("yieldMwhPerMwp") / n,
      };
    });
  }, [data.cells]);

  function exportData() {
    downloadCsv("performance-grid", [
      [
        "Region",
        "Block",
        "Energy MWh",
        "CUF %",
        "PA %",
        "GA %",
        "PR %",
        "Yield MWh/MWp",
      ],
      ...data.cells.map((c) => [
        c.region,
        c.block,
        c.energyMwh.toFixed(2),
        c.cufPct.toFixed(2),
        c.paPct.toFixed(2),
        c.gaPct.toFixed(2),
        c.prPct.toFixed(2),
        c.yieldMwhPerMwp.toFixed(2),
      ]),
    ]);
  }

  return (
    <motion.section
      ref={ref as React.RefObject<HTMLElement>}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className={`${panelClass} ${active ? "overflow-auto bg-page p-4" : ""}`}
      aria-label="Performance grid"
    >
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-edge px-4 py-3">
        <div>
          <h2 className={sectionTitleClass}>Performance Grid</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Toggle
            label="Median"
            checked={medianMode}
            onChange={setMedianMode}
          />
          <Toggle label="Grid" checked={showGrid} onChange={setShowGrid} />
          <ChartToolbar
            onExport={exportData}
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

      <div className="p-4">
        <div className="overflow-x-auto">
          <div
            className="inline-grid min-w-full gap-1.5"
            style={{
              gridTemplateColumns: `72px repeat(${data.cols.length}, minmax(64px, 1fr))`,
            }}
          >
            <div />
            {data.cols.map((col) => (
              <div
                key={col}
                className="px-1 pb-1 text-center text-[10px] font-medium text-muted"
              >
                {col}
              </div>
            ))}
            {data.rows.map((row) => (
              <div key={row} className="contents">
                <div className="flex items-center text-[11px] font-medium text-secondary">
                  {row}
                </div>
                {data.cols.map((col) => {
                  const cell = cellMap.get(`${row}|${col}`);
                  if (!cell) return <div key={col} />;
                  const active = selectedId === cell.id;
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedId(cell.id)}
                      title={`${cell.region} ${cell.block}: PR ${cell.prPct.toFixed(1)}%`}
                      className={[
                        "relative aspect-square min-h-14 rounded-md transition-transform",
                        active ? "ring-2 ring-accent ring-offset-1 ring-offset-page" : "",
                        showGrid ? "outline outline-1 outline-edge" : "",
                      ].join(" ")}
                      style={{
                        backgroundColor: prColor(
                          cell.prPct,
                          medianMode,
                          data.medianPr,
                        ),
                      }}
                    >
                      <span className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-semibold tabular-nums text-white drop-shadow-sm">
                        {cell.prPct.toFixed(0)}
                        <span className="text-[8px] font-medium opacity-80">
                          PR
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted">
          <span>PR scale</span>
          <span className="inline-flex overflow-hidden rounded">
            {[64, 72, 80, 88, 95].map((v) => (
              <span
                key={v}
                className="h-2 w-6"
                style={{ backgroundColor: prColor(v, false, data.medianPr) }}
              />
            ))}
          </span>
          <span className="tabular-nums">Low → High</span>
          {selected ? (
            <span className="ml-auto tabular-nums text-secondary">
              {selected.region} · {selected.block}: {selected.energyMwh.toFixed(2)}{" "}
              MWh · CUF {selected.cufPct.toFixed(1)}%
            </span>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto border-t border-edge">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="border-b border-edge bg-fill/60 text-[10px] uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-medium">Region</th>
              <th className="px-3 py-2.5 font-medium">Energy [MWh]</th>
              <th className="px-3 py-2.5 font-medium">CUF [%]</th>
              <th className="px-3 py-2.5 font-medium">PA [%]</th>
              <th className="px-3 py-2.5 font-medium">GA [%]</th>
              <th className="px-3 py-2.5 font-medium">PR [%]</th>
              <th className="px-3 py-2.5 font-medium">Yield [MWh/MWp]</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr
                key={row.region}
                className="border-b border-edge last:border-b-0 hover:bg-fill/40"
              >
                <td className="px-4 py-2.5 font-medium text-fg">{row.region}</td>
                <td className="px-3 py-2.5 tabular-nums text-secondary">
                  {row.energyMwh.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 tabular-nums text-secondary">
                  {row.cufPct.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 tabular-nums text-secondary">
                  {row.paPct.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 tabular-nums text-secondary">
                  {row.gaPct.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 tabular-nums text-secondary">
                  {row.prPct.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 tabular-nums text-secondary">
                  {row.yieldMwhPerMwp.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-fill-strong",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
      </button>
      {label}
    </label>
  );
}
