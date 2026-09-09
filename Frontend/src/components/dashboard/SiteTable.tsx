import { useNavigate } from "react-router-dom";

import { useWorkspace } from "@/context/WorkspaceContext";
import type { Site, SiteStatus } from "@/lib/api";
import { siteStatusColor, siteStatusLabel } from "@/lib/labels";

type SiteTableProps = {
  sites: Site[];
};

export function SiteTable({ sites }: SiteTableProps) {
  const { selectedSite, selectSite } = useWorkspace();
  const navigate = useNavigate();

  if (sites.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-10 text-center text-sm text-white/40">
        No sites yet. Create a site to start adding projects.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] shadow-[0_8px_28px_rgba(0,0,0,0.22)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
              <th className="px-5 py-3 font-medium">Site</th>
              <th className="px-5 py-3 font-medium">Location</th>
              <th className="px-5 py-3 font-medium">Projects</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => {
              const selected = selectedSite?.id === site.id;
              return (
                <tr
                  key={site.id}
                  onClick={() => {
                    selectSite(site.id);
                    void navigate("/");
                  }}
                  className={`cursor-pointer border-b border-white/[0.05] last:border-b-0 transition-colors ${
                    selected ? "bg-[#e6740a]/12" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-white">{site.name}</p>
                    {site.description ? (
                      <p className="mt-0.5 max-w-md truncate text-xs text-white/40">
                        {site.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5 text-white/70">{site.location}</td>
                  <td className="px-5 py-3.5 tabular-nums text-white">
                    {site.projectCount}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={site.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SiteStatus }) {
  const color = siteStatusColor[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/55">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {siteStatusLabel[status]}
    </span>
  );
}
