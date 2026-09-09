import { useEffect, useId, useRef, useState } from "react";
import { ChevronRight, LayoutGrid, Search } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useWorkspace } from "@/context/WorkspaceContext";
import { isProjectPath, projectHomePath, swapProjectInPath } from "@/lib/paths";

import { compactSearchClass, menuPanelClass } from "./panel";

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
    openProject,
  } = useWorkspace();
  const projectRoute = isProjectPath(pathname);

  function goToSite(siteId: string) {
    selectSite(siteId);
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
    <div className="flex min-w-0 items-center">
      <Switcher
        label="Site"
        value={selectedSite?.name ?? "Select site"}
        disabled={!sites.length}
        searchPlaceholder="Find a site"
        footer={{ to: "/sites", label: "View all sites" }}
      >
        {(query) => {
          const q = query.trim().toLowerCase();
          const filtered = q
            ? sites.filter(
                (site) =>
                  site.name.toLowerCase().includes(q) ||
                  site.location.toLowerCase().includes(q),
              )
            : sites;

          if (filtered.length === 0) {
            return (
              <p className="px-3 py-2 text-xs text-muted">No matching sites</p>
            );
          }

          return filtered.map((site) => (
            <SwitcherOption
              key={site.id}
              selected={site.id === selectedSite?.id}
              onSelect={() => goToSite(site.id)}
            >
              {site.name}
            </SwitcherOption>
          ));
        }}
      </Switcher>

      <ChevronRight
        className="mx-1 h-3.5 w-3.5 shrink-0 text-subtle sm:mx-1.5"
        strokeWidth={2}
        aria-hidden
      />

      <Switcher
        label="Project"
        value={
          projectRoute
            ? (selectedProject?.name ?? "Select project")
            : "Select project"
        }
        disabled={!selectedSite}
        searchPlaceholder="Find a project"
        footer={{ to: "/projects", label: "View all projects" }}
      >
        {(query) => {
          const q = query.trim().toLowerCase();
          const filtered = q
            ? projects.filter(
                (project) =>
                  project.name.toLowerCase().includes(q) ||
                  project.location.toLowerCase().includes(q),
              )
            : projects;

          if (filtered.length === 0) {
            return (
              <p className="px-3 py-2 text-xs text-muted">
                {q
                  ? "No matching projects"
                  : "No projects at this site. Switch the site to see others."}
              </p>
            );
          }

          return filtered.map((project) => (
            <SwitcherOption
              key={project.id}
              selected={project.id === selectedProject?.id && projectRoute}
              onSelect={() => goToProject(project)}
            >
              {project.name}
            </SwitcherOption>
          ));
        }}
      </Switcher>
    </div>
  );
}

function Switcher({
  label,
  value,
  disabled,
  searchPlaceholder,
  footer,
  children,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  searchPlaceholder: string;
  footer: { to: string; label: string };
  children: (query: string) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const menuId = useId();
  const searchId = useId();

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    searchRef.current?.focus();
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
        className="flex min-w-0 max-w-[220px] flex-col rounded-md px-1.5 py-1 text-left transition-colors hover:bg-fill disabled:opacity-50"
      >
        <span className="text-[11px] font-medium text-muted">{label}</span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-medium text-fg">{value}</span>
          <span
            aria-hidden
            className={`inline-block shrink-0 -translate-x-[3px] border-x-[3.5px] border-x-transparent border-t-[4.5px] border-t-muted transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="listbox"
          className={`${menuPanelClass} absolute left-0 top-full z-50 mt-1 w-72`}
        >
          <div className="border-b border-edge p-2">
            <label className="relative block">
              <span className="sr-only">{searchPlaceholder}</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
              <input
                ref={searchRef}
                id={searchId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className={`${compactSearchClass} w-full`}
              />
            </label>
          </div>
          <div
            className="max-h-64 overflow-y-auto py-1"
            onClick={() => setOpen(false)}
          >
            {children(query)}
          </div>
          <Link
            to={footer.to}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 border-t border-edge px-3 py-2.5 text-sm text-muted transition-colors hover:bg-fill hover:text-fg"
          >
            <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.8} />
            {footer.label}
          </Link>
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
      className={`relative block w-full px-3 py-2 text-left text-sm transition-colors ${
        selected
          ? "bg-fill font-medium text-fg"
          : "text-secondary hover:bg-fill hover:text-fg"
      }`}
    >
      {selected ? (
        <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-accent" />
      ) : null}
      <span className="block truncate">{children}</span>
    </button>
  );
}
