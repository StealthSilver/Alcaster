import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { DashboardShell } from "@/components/dashboard";
import { FormField } from "@/components/dashboard/FormField";
import { formControlClass, panelClass } from "@/components/dashboard/panel";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  ApiError,
  createProjectRequest,
  type ProjectStatus,
  type ProjectType,
} from "@/lib/api";

type FormValues = {
  siteId: string;
  name: string;
  location: string;
  type: ProjectType | "";
  status: ProjectStatus;
  capacityMw: string;
  description: string;
};

const emptyValues: FormValues = {
  siteId: "",
  name: "",
  location: "",
  type: "",
  status: "pending",
  capacityMw: "",
  description: "",
};

function validate(values: FormValues) {
  const fields: Partial<Record<keyof FormValues, string>> = {};
  if (!values.siteId) fields.siteId = "Select a site.";
  if (!values.name.trim()) fields.name = "Project name is required.";
  else if (values.name.trim().length < 2) fields.name = "Enter a project name.";
  if (!values.location.trim()) fields.location = "Location is required.";
  else if (values.location.trim().length < 2) {
    fields.location = "Enter a location.";
  }
  if (!values.type) fields.type = "Select a project type.";
  const capacity = Number(values.capacityMw);
  if (values.capacityMw.trim() === "") fields.capacityMw = "Capacity is required.";
  else if (Number.isNaN(capacity) || capacity < 0) {
    fields.capacityMw = "Enter a valid capacity.";
  }
  return fields;
}

export function CreateProjectPage() {
  const { user } = useAuth();
  const { sites, selectedSite, openProject, refreshProjects } = useWorkspace();
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>({
    ...emptyValues,
    siteId: selectedSite?.id ?? "",
    location: selectedSite?.location ?? "",
  });
  const [fields, setFields] = useState<Partial<Record<keyof FormValues, string>>>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedSite) return;
    setValues((prev) => {
      if (prev.siteId) return prev;
      return {
        ...prev,
        siteId: selectedSite.id,
        location: prev.location || selectedSite.location,
      };
    });
  }, [selectedSite]);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (fields[key]) setFields((prev) => ({ ...prev, [key]: undefined }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const nextFields = validate(values);
    setFields(nextFields);
    if (Object.keys(nextFields).length > 0 || !values.type) return;

    setSubmitting(true);
    try {
      await createProjectRequest({
        siteId: values.siteId,
        name: values.name.trim(),
        location: values.location.trim(),
        type: values.type,
        status: values.status,
        capacityMw: Number(values.capacityMw),
        description: values.description.trim(),
      }).then(async ({ project }) => {
        openProject(project);
        await refreshProjects(project.siteId);
        void navigate(`/projects/${project.id}`, { replace: true });
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setFields(error.fields);
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const shellUser = user
    ? { name: user.name, role: user.role, initials: user.initials }
    : { name: "User", role: "Organization Manager", initials: "U" };

  return (
    <DashboardShell user={shellUser} title="Create project">
      <div className="max-w-2xl">
        <p className="mb-5 text-sm text-muted">
          Create a project at a site to track plant operations, twins, and performance.
        </p>
        <form onSubmit={onSubmit} noValidate className={panelClass}>
          <div className="p-6">
          {formError && !fields.name ? (
            <p
              role="alert"
              className="mb-4 rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {formError}
            </p>
          ) : null}

          <div className="space-y-4">
            <FormField
              id="project-site"
              label="Site"
              hint="The site this project belongs to."
              error={fields.siteId}
            >
              <select
                id="project-site"
                name="siteId"
                value={values.siteId}
                onChange={(event) => {
                  const nextSiteId = event.target.value;
                  const site = sites.find((item) => item.id === nextSiteId);
                  update("siteId", nextSiteId);
                  if (site && !values.location) update("location", site.location);
                }}
                className={formControlClass(fields.siteId)}
              >
                <option value="">Select site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              id="project-name"
              label="Name"
              hint="A unique name for this project."
              error={fields.name}
            >
              <input
                id="project-name"
                name="name"
                placeholder="ABC Solar Plant"
                value={values.name}
                onChange={(event) => update("name", event.target.value)}
                aria-invalid={Boolean(fields.name)}
                className={formControlClass(fields.name)}
              />
            </FormField>

            <FormField
              id="project-location"
              label="Location"
              hint="Region or state where this project operates."
              error={fields.location}
            >
              <input
                id="project-location"
                name="location"
                placeholder="Karnataka"
                value={values.location}
                onChange={(event) => update("location", event.target.value)}
                aria-invalid={Boolean(fields.location)}
                className={formControlClass(fields.location)}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField id="project-type" label="Type" error={fields.type}>
                <select
                  id="project-type"
                  name="type"
                  value={values.type}
                  onChange={(event) =>
                    update("type", event.target.value as ProjectType | "")
                  }
                  aria-invalid={Boolean(fields.type)}
                  className={formControlClass(fields.type)}
                >
                  <option value="">Select type</option>
                  <option value="solar">Solar</option>
                  <option value="wind">Wind</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="bess">BESS</option>
                </select>
              </FormField>

              <FormField id="project-status" label="Status" error={fields.status}>
                <select
                  id="project-status"
                  name="status"
                  value={values.status}
                  onChange={(event) =>
                    update("status", event.target.value as ProjectStatus)
                  }
                  className={formControlClass(fields.status)}
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </FormField>
            </div>

            <FormField
              id="project-capacity"
              label="Capacity (MW)"
              error={fields.capacityMw}
            >
              <input
                id="project-capacity"
                name="capacityMw"
                type="number"
                min={0}
                step="0.1"
                placeholder="100"
                value={values.capacityMw}
                onChange={(event) => update("capacityMw", event.target.value)}
                aria-invalid={Boolean(fields.capacityMw)}
                className={formControlClass(fields.capacityMw)}
              />
            </FormField>

            <FormField
              id="project-description"
              label="Description"
              hint="Optional. Shown on the project overview."
              error={fields.description}
            >
              <textarea
                id="project-description"
                name="description"
                rows={3}
                placeholder="Notes about this project"
                value={values.description}
                onChange={(event) => update("description", event.target.value)}
                className={formControlClass(
                  fields.description,
                  "h-auto min-h-[80px] py-2",
                )}
              />
            </FormField>
          </div>
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-edge bg-surface px-6 py-3">
            <Link
              to="/projects"
              className="inline-flex h-8 items-center rounded-md px-3 text-sm text-muted transition-colors hover:bg-fill hover:text-fg"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create project"
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
