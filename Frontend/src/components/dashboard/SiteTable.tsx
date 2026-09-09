import { useNavigate } from "react-router-dom";

import { useWorkspace } from "@/context/WorkspaceContext";
import type { Site, SiteStatus } from "@/lib/api";
import { siteStatusLabel, siteStatusLozenge } from "@/lib/labels";

type SiteTableProps = {
  sites: Site[];
};

export function SiteTable({ sites }: SiteTableProps) {
  const { selectedSite, selectSite } = useWorkspace();
  const navigate = useNavigate();

  if (sites.length === 0) {
    return (
      <div className="rounded-md border border-edge bg-surface px-4 py-12 text-center text-sm text-muted">
        No sites yet. Create a site to start adding projects.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-edge bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-edge bg-fill text-xs font-medium text-muted">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Location</th>
              <th className="px-4 py-2.5 font-medium">Projects</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
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
                  className={`cursor-pointer border-b border-edge last:border-b-0 ${
                    selected ? "bg-fill" : "hover:bg-fill"
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-fg">{site.name}</p>
                    {site.description ? (
                      <p className="mt-0.5 max-w-md truncate text-xs text-muted">
                        {site.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 text-muted">{site.location}</td>
                  <td className="px-4 py-2.5 tabular-nums text-secondary">
                    {site.projectCount}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusLozenge status={site.status} />
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

function StatusLozenge({ status }: { status: SiteStatus }) {
  return (
    <span
      className={`inline-flex h-5 items-center rounded px-1.5 text-xs font-medium ${siteStatusLozenge[status]}`}
    >
      {siteStatusLabel[status]}
    </span>
  );
}
