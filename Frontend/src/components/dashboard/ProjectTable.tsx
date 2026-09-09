import { useNavigate } from "react-router-dom";

import { useWorkspace } from "@/context/WorkspaceContext";
import type { Project, ProjectStatus } from "@/lib/api";
import {
  projectStatusLabel,
  projectStatusLozenge,
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
      <div className="rounded-md border border-edge bg-surface px-4 py-12 text-center text-sm text-muted">
        No projects at this site yet. Create a project to get started.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-edge bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-edge bg-fill text-xs font-medium text-muted">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Site</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Capacity</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
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
                  className={`cursor-pointer border-b border-edge last:border-b-0 ${
                    selected ? "bg-fill" : "hover:bg-fill"
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-fg">{project.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {project.location}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{project.siteName}</td>
                  <td className="px-4 py-2.5 text-muted">
                    {projectTypeLabel[project.type]}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-secondary">
                    {project.capacityMw}{" "}
                    <span className="text-muted">MW</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusLozenge status={project.status} />
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

function StatusLozenge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex h-5 items-center rounded px-1.5 text-xs font-medium ${projectStatusLozenge[status]}`}
    >
      {projectStatusLabel[status]}
    </span>
  );
}
