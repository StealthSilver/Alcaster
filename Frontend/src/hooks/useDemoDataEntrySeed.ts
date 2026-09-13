import { useEffect } from "react";

import { useWorkspace } from "@/context/WorkspaceContext";
import { ensureDemoDataEntryForProjects } from "@/lib/demoDataEntry";

/** Seeds demo plant data-entry so core products (+ asset DT) show as running. */
export function useDemoDataEntrySeed() {
  const { projects, loading } = useWorkspace();

  useEffect(() => {
    if (loading || projects.length === 0) return;
    ensureDemoDataEntryForProjects(projects);
  }, [loading, projects]);
}
