import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { FormField } from "@/components/dashboard/FormField";
import { formControlClass } from "@/components/dashboard/panel";
import {
  ApiError,
  createProjectRequest,
  updateProjectRequest,
  type Project,
  type ProjectStatus,
  type ProjectType,
  type Site,
} from "@/lib/api";

import { Drawer } from "./Drawer";

type ProjectFormValues = {
  siteId: string;
  name: string;
  location: string;
  type: ProjectType | "";
  status: ProjectStatus;
  capacityMw: string;
  description: string;
};

const emptyValues: ProjectFormValues = {
  siteId: "",
  name: "",
  location: "",
  type: "",
  status: "pending",
  capacityMw: "",
  description: "",
};

function valuesFromProject(project: Project): ProjectFormValues {
  return {
    siteId: project.siteId,
    name: project.name,
    location: project.location,
    type: project.type,
    status: project.status,
    capacityMw: String(project.capacityMw),
    description: project.description,
  };
}

function validate(values: ProjectFormValues) {
  const fields: Partial<Record<keyof ProjectFormValues, string>> = {};
  if (!values.siteId) fields.siteId = "Select a site.";
  if (!values.name.trim()) fields.name = "Project name is required.";
  else if (values.name.trim().length < 2) fields.name = "Enter a project name.";
  if (!values.location.trim()) fields.location = "Location is required.";
  else if (values.location.trim().length < 2) {
    fields.location = "Enter a location.";
  }
  if (!values.type) fields.type = "Select a project type.";
  if (values.capacityMw.trim() === "") fields.capacityMw = "Capacity is required.";
  else {
    const capacity = Number(values.capacityMw);
    if (!Number.isFinite(capacity) || capacity < 0) {
      fields.capacityMw = "Enter a valid capacity.";
    }
  }
  return fields;
}

type ProjectDrawerProps = {
  open: boolean;
  project?: Project | null;
  sites: Site[];
  defaultSiteId?: string;
  onClose: () => void;
  onSaved: (project: Project) => void | Promise<void>;
};

export function ProjectDrawer({
  open,
  project,
  sites,
  defaultSiteId,
  onClose,
  onSaved,
}: ProjectDrawerProps) {
  const editing = Boolean(project);
  const [values, setValues] = useState<ProjectFormValues>(emptyValues);
  const [fields, setFields] = useState<
    Partial<Record<keyof ProjectFormValues, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (project) {
      setValues(valuesFromProject(project));
    } else {
      const site =
        sites.find((item) => item.id === defaultSiteId) ?? sites[0] ?? null;
      setValues({
        ...emptyValues,
        siteId: site?.id ?? "",
        location: site?.address ?? "",
      });
    }
    setFields({});
    setFormError(null);
    setSubmitting(false);
  }, [defaultSiteId, open, project, sites]);

  function update<K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (fields[key]) setFields((prev) => ({ ...prev, [key]: undefined }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const nextFields = validate(values);
    setFields(nextFields);
    if (Object.keys(nextFields).length > 0 || !values.type) return;

    const payload = {
      name: values.name.trim(),
      location: values.location.trim(),
      type: values.type,
      status: values.status,
      capacityMw: Number(values.capacityMw),
      description: values.description.trim(),
    };

    setSubmitting(true);
    try {
      const result = project
        ? await updateProjectRequest(project.id, payload)
        : await createProjectRequest({ ...payload, siteId: values.siteId });
      await onSaved(result.project);
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

  return (
    <Drawer
      open={open}
      title={editing ? "Edit project" : "Create project"}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 items-center rounded-md px-3 text-sm text-muted transition-colors hover:bg-fill hover:text-fg"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="project-drawer-form"
            disabled={submitting}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {editing ? "Saving…" : "Creating…"}
              </>
            ) : editing ? (
              "Save"
            ) : (
              "Create project"
            )}
          </button>
        </div>
      }
    >
      <form id="project-drawer-form" onSubmit={onSubmit} noValidate>
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
            required
            error={fields.siteId}
          >
            <select
              id="project-site"
              name="siteId"
              value={values.siteId}
              disabled={editing}
              onChange={(event) => {
                const nextSiteId = event.target.value;
                const site = sites.find((item) => item.id === nextSiteId);
                update("siteId", nextSiteId);
                if (site) update("location", site.address);
              }}
              className={formControlClass(
                fields.siteId,
                editing ? "cursor-not-allowed opacity-70" : "",
              )}
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
            label="Project Name"
            required
            error={fields.name}
          >
            <input
              id="project-name"
              name="name"
              placeholder="ABC Solar Plant"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              className={formControlClass(fields.name)}
            />
          </FormField>

          <FormField
            id="project-location"
            label="Location"
            required
            error={fields.location}
          >
            <input
              id="project-location"
              name="location"
              placeholder="Karnataka"
              value={values.location}
              onChange={(event) => update("location", event.target.value)}
              className={formControlClass(fields.location)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField id="project-type" label="Type" required error={fields.type}>
              <select
                id="project-type"
                name="type"
                value={values.type}
                onChange={(event) =>
                  update("type", event.target.value as ProjectType | "")
                }
                className={formControlClass(fields.type)}
              >
                <option value="">Select type</option>
                <option value="solar">Solar</option>
                <option value="wind">Wind</option>
                <option value="hybrid">Hybrid</option>
                <option value="bess">BESS</option>
              </select>
            </FormField>

            <FormField
              id="project-status"
              label="Status"
              required
              error={fields.status}
            >
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
            required
            error={fields.capacityMw}
          >
            <input
              id="project-capacity"
              name="capacityMw"
              inputMode="decimal"
              placeholder="100"
              value={values.capacityMw}
              onChange={(event) => update("capacityMw", event.target.value)}
              className={formControlClass(fields.capacityMw)}
            />
          </FormField>

          <FormField
            id="project-description"
            label="Description"
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
      </form>
    </Drawer>
  );
}
