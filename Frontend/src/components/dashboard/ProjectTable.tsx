import type { Project, ProjectStatus } from "@/lib/api";
import {
  projectStatusLabel,
  projectStatusLozenge,
  projectTypeLabel,
} from "@/lib/labels";
import { canDeleteProject, canEditProject } from "@/lib/roles";

type ProjectTableProps = {
  projects: Project[];
  role: string;
  onView: (project: Project) => void;
  onTeam: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
};

const actionClass =
  "inline-flex h-7 items-center rounded-md px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45";

export function ProjectTable({
  projects,
  role,
  onView,
  onTeam,
  onEdit,
  onDelete,
}: ProjectTableProps) {
  const canEdit = canEditProject(role);
  const canDelete = canDeleteProject(role);

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
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[36%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-edge bg-fill text-xs font-medium text-muted">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Site</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Capacity</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr
                key={project.id}
                className="border-b border-edge last:border-b-0 hover:bg-fill"
              >
                <td className="px-4 py-3">
                  <p className="truncate font-medium text-fg" title={project.name}>
                    {project.name}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="block truncate text-muted"
                    title={project.siteName || undefined}
                  >
                    {project.siteName || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">
                  {projectTypeLabel[project.type]}
                </td>
                <td className="px-4 py-3 tabular-nums text-secondary">
                  {project.capacityMw}{" "}
                  <span className="text-muted">MW</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusLozenge status={project.status} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onView(project)}
                      className={`${actionClass} bg-[#2a6b45] text-white hover:bg-[#245c3b]`}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => onTeam(project)}
                      className={`${actionClass} border border-edge-strong text-secondary hover:bg-fill hover:text-fg`}
                    >
                      Team
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit}
                      title={
                        canEdit
                          ? "Edit project"
                          : "You do not have permission to edit projects."
                      }
                      onClick={() => onEdit(project)}
                      className={`${actionClass} border border-edge-strong text-secondary hover:bg-fill hover:text-fg`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={!canDelete}
                      title={
                        canDelete
                          ? "Delete project"
                          : "You do not have permission to delete projects."
                      }
                      onClick={() => onDelete(project)}
                      className={`${actionClass} border border-edge-strong text-danger hover:bg-danger/10`}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
