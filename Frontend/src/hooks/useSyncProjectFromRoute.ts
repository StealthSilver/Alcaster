import { useEffect } from "react";
import { useParams } from "react-router-dom";

import { useWorkspace } from "@/context/WorkspaceContext";
import { getProjectRequest } from "@/lib/api";

export function useSyncProjectFromRoute() {
  const { projectId } = useParams();
  const { projects, selectedProject, loading, openProject } = useWorkspace();

  useEffect(() => {
    if (!projectId || loading) return;
    if (selectedProject?.id === projectId) return;

    const match = projects.find((project) => project.id === projectId);
    if (match) {
      openProject(match);
      return;
    }

    let cancelled = false;
    getProjectRequest(projectId)
      .then(({ project }) => {
        if (!cancelled) openProject(project);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [loading, openProject, projectId, projects, selectedProject?.id]);
}
