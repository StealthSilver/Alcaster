import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/context/AuthContext";
import {
  ApiError,
  listProjectsRequest,
  listSitesRequest,
  type Project,
  type Site,
} from "@/lib/api";

type WorkspaceContextValue = {
  sites: Site[];
  projects: Project[];
  selectedSite: Site | null;
  selectedProject: Project | null;
  loading: boolean;
  selectSite: (siteId: string) => void;
  selectProject: (projectId: string | null) => void;
  openProject: (project: Pick<Project, "id" | "siteId">) => void;
  refreshSites: () => Promise<void>;
  refreshProjects: (forSiteId?: string) => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function storageKey(userId: string) {
  return `alcaster.workspace.${userId}`;
}

function readStored(userId: string): {
  siteId: string | null;
  projectId: string | null;
} {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { siteId: null, projectId: null };
    const parsed = JSON.parse(raw) as {
      siteId?: string | null;
      projectId?: string | null;
    };
    return {
      siteId: parsed.siteId ?? null,
      projectId: parsed.projectId ?? null,
    };
  } catch {
    return { siteId: null, projectId: null };
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback(
    (nextSiteId: string | null, nextProjectId: string | null) => {
      if (!user) return;
      localStorage.setItem(
        storageKey(user.id),
        JSON.stringify({ siteId: nextSiteId, projectId: nextProjectId }),
      );
    },
    [user],
  );

  const refreshSites = useCallback(async () => {
    if (!user) return;
    const stored = readStored(user.id);
    const { sites: nextSites } = await listSitesRequest();
    const nextSiteId =
      nextSites.find((site) => site.id === stored.siteId)?.id ??
      nextSites.find((site) => site.id === siteId)?.id ??
      nextSites[0]?.id ??
      null;
    setSites(nextSites);
    setSiteId(nextSiteId);
    persist(nextSiteId, stored.projectId);
  }, [persist, siteId, user]);

  const refreshProjects = useCallback(async (forSiteId?: string) => {
    if (!user) return;
    const id = forSiteId ?? siteId;
    if (!id) return;
    const { projects: nextProjects } = await listProjectsRequest(id);
    setProjects(nextProjects);
    setProjectId((current) => {
      if (current && nextProjects.some((project) => project.id === current)) {
        return current;
      }
      persist(id, null);
      return null;
    });
  }, [persist, siteId, user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const stored = readStored(user.id);

    listSitesRequest()
      .then(({ sites: nextSites }) => {
        if (cancelled) return;
        const nextSiteId =
          nextSites.find((site) => site.id === stored.siteId)?.id ??
          nextSites[0]?.id ??
          null;
        setSites(nextSites);
        setSiteId(nextSiteId);
        setProjectId(stored.projectId);
        persist(nextSiteId, stored.projectId);
      })
      .catch((error: unknown) => {
        if (!(error instanceof ApiError) || error.status !== 401) {
          console.error(error);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [persist, user]);

  useEffect(() => {
    if (!user || !siteId) return;
    let cancelled = false;

    listProjectsRequest(siteId)
      .then(({ projects: nextProjects }) => {
        if (cancelled) return;
        setProjects(nextProjects);
        setProjectId((current) => {
          if (current && nextProjects.some((project) => project.id === current)) {
            return current;
          }
          persist(siteId, null);
          return null;
        });
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, [persist, siteId, user]);

  const selectSite = useCallback(
    (nextSiteId: string) => {
      setSiteId(nextSiteId);
      setProjectId(null);
      setProjects([]);
      persist(nextSiteId, null);
    },
    [persist],
  );

  const selectProject = useCallback(
    (nextProjectId: string | null) => {
      setProjectId(nextProjectId);
      persist(siteId, nextProjectId);
    },
    [persist, siteId],
  );

  const openProject = useCallback(
    (project: Pick<Project, "id" | "siteId">) => {
      setSiteId(project.siteId);
      setProjectId(project.id);
      persist(project.siteId, project.id);
    },
    [persist],
  );

  const selectedSite = useMemo(
    () => sites.find((site) => site.id === siteId) ?? null,
    [siteId, sites],
  );
  const siteProjects = useMemo(
    () =>
      selectedSite
        ? projects.filter((project) => project.siteId === selectedSite.id)
        : [],
    [projects, selectedSite],
  );
  const selectedProject = useMemo(
    () => siteProjects.find((project) => project.id === projectId) ?? null,
    [projectId, siteProjects],
  );

  const value = useMemo(
    () => ({
      sites,
      projects: siteProjects,
      selectedSite,
      selectedProject,
      loading,
      selectSite,
      selectProject,
      openProject,
      refreshSites,
      refreshProjects,
    }),
    [
      loading,
      siteProjects,
      refreshProjects,
      refreshSites,
      openProject,
      selectProject,
      selectSite,
      selectedProject,
      selectedSite,
      sites,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}
