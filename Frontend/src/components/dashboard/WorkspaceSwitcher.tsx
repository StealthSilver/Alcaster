import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useWorkspace } from "@/context/WorkspaceContext";
import { isProjectPath, projectHomePath, swapProjectInPath } from "@/lib/paths";

type WorkspaceSwitcherProps = {
  onNavigate?: () => void;
};

export function WorkspaceSwitcher({ onNavigate }: WorkspaceSwitcherProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const {
    sites,
    projects,
    selectedSite,
    selectedProject,
    selectSite,
    selectProject,
    openProject,
  } = useWorkspace();
  const projectRoute = isProjectPath(pathname);

  function goToSite(siteId: string) {
    selectSite(siteId);
    onNavigate?.();
    void navigate("/");
  }

  function goToSiteOverview() {
    selectProject(null);
    onNavigate?.();
    void navigate("/");
  }

  function goToProject(project: { id: string; siteId: string }) {
    openProject(project);
    onNavigate?.();
    if (projectRoute) {
      void navigate(swapProjectInPath(pathname, project.id));
    } else {
      void navigate(projectHomePath(project.id));
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
      <Switcher
        label="Site"
        value={selectedSite?.name ?? "Select site"}
        disabled={!sites.length}
      >
        {sites.map((site) => (
          <SwitcherOption
            key={site.id}
            selected={site.id === selectedSite?.id}
            onSelect={() => goToSite(site.id)}
          >
            <span className="block truncate">{site.name}</span>
            <span className="block truncate text-[11px] text-white/35">
              {site.location}
            </span>
          </SwitcherOption>
        ))}
        {sites.length === 0 ? (
          <p className="px-3 py-2 text-xs text-white/40">No sites yet</p>
        ) : null}
      </Switcher>

      <Switcher
        label="Project"
        labelClassName="text-[rgba(120,180,140,0.95)]"
        value={
          projectRoute
            ? (selectedProject?.name ?? "Select project")
            : "Site overview"
        }
        disabled={!selectedSite}
      >
        <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/30">
          {selectedSite ? `At ${selectedSite.name}` : "Select a site first"}
        </p>
        <SwitcherOption selected={!projectRoute} onSelect={goToSiteOverview}>
          <span className="block truncate">Site overview</span>
          <span className="block truncate text-[11px] text-white/35">
            {selectedSite?.name ?? "Current site"}
          </span>
        </SwitcherOption>
        {projects.length > 0 ? (
          <div className="my-1 h-px bg-white/[0.06]" />
        ) : null}
        {projects.map((project) => (
          <SwitcherOption
            key={project.id}
            selected={project.id === selectedProject?.id && projectRoute}
            onSelect={() => goToProject(project)}
          >
            <span className="block truncate">{project.name}</span>
            <span className="block truncate text-[11px] text-white/35">
              {project.location}
            </span>
          </SwitcherOption>
        ))}
        {projects.length === 0 ? (
          <p className="px-3 py-2 text-xs text-white/40">
            No projects at this site. Switch the site to see others.
          </p>
        ) : null}
      </Switcher>
    </div>
  );
}

function Switcher({
  label,
  labelClassName = "text-white/40",
  value,
  disabled,
  children,
}: {
  label: string;
  labelClassName?: string;
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="flex min-w-0 max-w-[220px] items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-white/[0.04] disabled:opacity-50"
      >
        <span className="min-w-0">
          <span
            className={`block text-[10px] font-medium uppercase tracking-[0.14em] ${labelClassName}`}
          >
            {label}
          </span>
          <span className="mt-0.5 block truncate text-sm font-semibold text-white">
            {value}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-white/35 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={1.75}
        />
      </button>
      {open ? (
        <div
          id={menuId}
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-white/[0.08] bg-[#071015] py-1 shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
        >
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      ) : null}
    </div>
  );
}

function SwitcherOption({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
        selected
          ? "bg-[#e6740a]/12 text-white"
          : "text-white/75 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
