import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useWorkspace } from "@/context/WorkspaceContext";
import type { Project, ProjectStatus } from "@/lib/api";
import {
  projectStatusColor,
  projectStatusLabel,
  projectTypeLabel,
} from "@/lib/labels";
import { projectHomePath } from "@/lib/paths";

type ProjectListProps = {
  projects: Project[];
  showViewAll?: boolean;
};

export function ProjectList({ projects, showViewAll = false }: ProjectListProps) {
  const { openProject } = useWorkspace();
  const navigate = useNavigate();

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_8px_28px_rgba(0,0,0,0.22)]"
      aria-label="Projects"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-white">
            Projects
          </h2>
          <p className="mt-1 text-sm text-white/40">
            Projects at this site
          </p>
        </div>
        {showViewAll ? (
          <Link
            to="/projects"
            className="text-xs font-medium text-[#e6740a] transition-opacity hover:opacity-80"
          >
            View all
          </Link>
        ) : null}
      </div>

      {projects.length === 0 ? (
        <p className="mt-8 text-sm text-white/40">
          No projects yet. Create a project to get started.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-white/[0.06]">
          {projects.map((project, index) => (
            <motion.li
              key={project.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.24 + index * 0.04, duration: 0.35 }}
              className="flex cursor-pointer flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 transition-colors hover:bg-white/[0.03]"
              onClick={() => {
                openProject(project);
                void navigate(projectHomePath(project.id));
              }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {project.name}
                </p>
                <p className="mt-0.5 text-xs text-white/40">
                  {project.location} · {projectTypeLabel[project.type]}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm font-semibold tabular-nums text-white">
                  {project.capacityMw}
                  <span className="ml-1 text-xs font-medium text-white/40">
                    MW
                  </span>
                </p>
                <StatusBadge status={project.status} />
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const color = projectStatusColor[status];
  const live = status === "active" || status === "pending";
  return (
    <span className="inline-flex min-w-[5.5rem] items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/55">
      <span className="relative flex h-1.5 w-1.5">
        {live ? (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40"
            style={{ backgroundColor: color, animationDuration: "2.4s" }}
          />
        ) : null}
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: live ? `0 0 8px ${color}` : "none",
          }}
        />
      </span>
      {projectStatusLabel[status]}
    </span>
  );
}
