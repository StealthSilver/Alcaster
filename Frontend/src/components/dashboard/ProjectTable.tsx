import { useNavigate } from "react-router-dom";

import { useWorkspace } from "@/context/WorkspaceContext";
import type { Project, ProjectStatus } from "@/lib/api";
import {
  projectStatusColor,
  projectStatusLabel,
  projectTypeLabel,
} from "@/lib/labels";
import { projectHomePath } from "@/lib/paths";

type ProjectTableProps = {
  projects: Project[];
};

export function ProjectTable({ projects }: ProjectTableProps) {
  const { selectedProject, openProject } = useWorkspace();
  const navigate = useNavigate();

  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-10 text-center text-sm text-white/40">
        No projects at this site yet. Create a project to get started.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] shadow-[0_8px_28px_rgba(0,0,0,0.22)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
              <th className="px-5 py-3 font-medium">Project</th>
              <th className="px-5 py-3 font-medium">Site</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Capacity</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const selected = selectedProject?.id === project.id;
              return (
                <tr
                  key={project.id}
                  onClick={() => {
                    openProject(project);
                    void navigate(projectHomePath(project.id));
                  }}
                  className={`cursor-pointer border-b border-white/[0.05] last:border-b-0 transition-colors ${
                    selected
                      ? "bg-[#e6740a]/12"
                      : "hover:bg-white/[0.03]"
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-white">{project.name}</p>
                    <p className="mt-0.5 text-xs text-white/40">
                      {project.location}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-white/70">{project.siteName}</td>
                  <td className="px-5 py-3.5 text-white/70">
                    {projectTypeLabel[project.type]}
                  </td>
                  <td className="px-5 py-3.5 font-semibold tabular-nums text-white">
                    {project.capacityMw}
                    <span className="ml-1 text-xs font-medium text-white/40">
                      MW
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={project.status} />
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

function StatusBadge({ status }: { status: ProjectStatus }) {
  const color = projectStatusColor[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/55">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {projectStatusLabel[status]}
    </span>
  );
}
