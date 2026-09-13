import { CMS_STATUS_META, type CmsPlantRow } from "@/lib/cmsMonitor";
import { panelClass } from "./panel";

type CmsPlantTableProps = {
  rows: CmsPlantRow[];
  onRowClick?: (rowId: string) => void;
};

export function CmsPlantTable({ rows, onRowClick }: CmsPlantTableProps) {
  return (
    <section className={`${panelClass} overflow-hidden`} aria-label="Plant grid">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-xs">
          <thead>
            <tr className="border-b border-edge bg-fill/40 text-[10px] uppercase tracking-wide text-muted">
              <th className="px-3 py-2.5 font-medium">Plant Name</th>
              <th className="px-3 py-2.5 font-medium">PR</th>
              <th className="px-3 py-2.5 font-medium">Yield</th>
              <th className="px-3 py-2.5 font-medium">Export</th>
              <th className="px-3 py-2.5 font-medium">PR Deviation</th>
              <th className="px-3 py-2.5 font-medium">Yield Deviation</th>
              <th className="px-3 py-2.5 font-medium">Import</th>
              <th className="px-3 py-2.5 font-medium">Insolation</th>
              <th className="px-3 py-2.5 font-medium">Active Power</th>
              <th className="px-3 py-2.5 font-medium">AC Cap</th>
              <th className="px-3 py-2.5 font-medium">DC Cap</th>
              <th className="px-3 py-2.5 font-medium">Location</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={[
                  "border-b border-edge/60 transition-colors hover:bg-fill/40",
                  onRowClick ? "cursor-pointer" : "",
                ].join(" ")}
                onClick={() => onRowClick?.(row.id)}
              >
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-2 font-medium text-fg">
                    <span
                      className="h-2 w-2 shrink-0 rounded-sm"
                      style={{
                        backgroundColor: CMS_STATUS_META[row.status].color,
                      }}
                    />
                    {row.name}
                  </span>
                </td>
                <td className="px-3 py-2.5 tabular-nums text-secondary">
                  {row.prPct.toFixed(2)}%
                </td>
                <td className="px-3 py-2.5 tabular-nums text-secondary">
                  {row.yieldMwhPerMwp.toFixed(2)} MWh/MWp
                </td>
                <td className="px-3 py-2.5 tabular-nums text-secondary">
                  {row.exportMwh.toFixed(2)} MWh
                </td>
                <td
                  className={[
                    "px-3 py-2.5 tabular-nums",
                    row.prDeviationPct >= 0 ? "text-success" : "text-danger",
                  ].join(" ")}
                >
                  {row.prDeviationPct.toFixed(2)}%
                </td>
                <td
                  className={[
                    "px-3 py-2.5 tabular-nums",
                    row.yieldDeviationPct >= 0 ? "text-success" : "text-danger",
                  ].join(" ")}
                >
                  {row.yieldDeviationPct.toFixed(2)}%
                </td>
                <td className="px-3 py-2.5 tabular-nums text-secondary">
                  {row.importMwh.toFixed(2)} MWh
                </td>
                <td className="px-3 py-2.5 tabular-nums text-secondary">
                  {row.insolationKwhM2.toFixed(2)} kWh/m²
                </td>
                <td className="px-3 py-2.5 tabular-nums text-secondary">
                  {row.activePowerMw.toFixed(2)} MW
                </td>
                <td className="px-3 py-2.5 tabular-nums text-secondary">
                  {row.acCapMw} MW
                </td>
                <td className="px-3 py-2.5 tabular-nums text-secondary">
                  {row.dcCapMwp.toFixed(2)} MWp
                </td>
                <td className="px-3 py-2.5 text-secondary">{row.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
