import { Link, useNavigate } from "react-router-dom";

import { useWorkspace } from "@/context/WorkspaceContext";
import type { Project, ProjectStatus } from "@/lib/api";
import {
  projectStatusLabel,
  projectStatusLozenge,
  projectTypeLabel,
} from "@/lib/labels";
import { projectHomePath } from "@/lib/paths";

import { panelClass, sectionHintClass, sectionTitleClass } from "./panel";

type ProjectListProps = {
  projects: Project[];
  showViewAll?: boolean;
};

export function ProjectList({ projects, showViewAll = false }: ProjectListProps) {
  const { openProject } = useWorkspace();
  const navigate = useNavigate();

  return (
    <section className={panelClass} aria-label="Projects">
      <div className="flex items-center justify-between gap-3 border-b border-edge px-4 py-3">
        <div>
          <h2 className={sectionTitleClass}>Projects</h2>
          <p className={sectionHintClass}>Projects at this site</p>
        </div>
        {showViewAll ? (
          <Link
            to="/projects"
            className="text-xs font-medium text-muted transition-colors hover:text-fg"
          >
            View all
          </Link>
        ) : null}
      </div>

      {projects.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted">
          No projects yet. Create a project to get started.
        </p>
      ) : (
        <ul className="divide-y divide-edge">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-fill"
              onClick={() => {
                openProject(project);
                void navigate(projectHomePath(project.id));
              }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-fg">
                  {project.name}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {project.location} · {projectTypeLabel[project.type]}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm tabular-nums text-secondary">
                  {project.capacityMw}
                  <span className="ml-1 text-xs text-muted">MW</span>
                </p>
                <StatusLozenge status={project.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
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
