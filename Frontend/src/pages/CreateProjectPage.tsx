import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Field } from "@/components/auth/Field";
import { inputClass } from "@/components/auth/inputClass";
import { DashboardShell } from "@/components/dashboard";
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
  const { sites, selectedSite, openProject, refreshProjects } =
    useWorkspace();
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

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <DashboardShell
      user={shellUser}
      dateLabel={dateLabel}
      title="Create Project"
    >
      <form
        onSubmit={onSubmit}
        noValidate
        className="max-w-xl space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
      >
        {formError && !fields.name ? (
          <p
            role="alert"
            className="rounded-lg border border-[#f07167]/25 bg-[#f07167]/10 px-3 py-2 text-sm text-[#f07167]"
          >
            {formError}
          </p>
        ) : null}

        <Field id="project-site" label="Site" error={fields.siteId}>
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
            className={`${inputClass(fields.siteId)} bg-[#010609]`}
          >
            <option value="">Select site</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </Field>

        <Field id="project-name" label="Project Name" error={fields.name}>
          <input
            id="project-name"
            name="name"
            placeholder="ABC Solar Plant"
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            aria-invalid={Boolean(fields.name)}
            className={inputClass(fields.name)}
          />
        </Field>

        <Field id="project-location" label="Location" error={fields.location}>
          <input
            id="project-location"
            name="location"
            placeholder="Karnataka"
            value={values.location}
            onChange={(event) => update("location", event.target.value)}
            aria-invalid={Boolean(fields.location)}
            className={inputClass(fields.location)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="project-type" label="Type" error={fields.type}>
            <select
              id="project-type"
              name="type"
              value={values.type}
              onChange={(event) =>
                update("type", event.target.value as ProjectType | "")
              }
              aria-invalid={Boolean(fields.type)}
              className={`${inputClass(fields.type)} bg-[#010609]`}
            >
              <option value="">Select type</option>
              <option value="solar">Solar</option>
              <option value="wind">Wind</option>
              <option value="hybrid">Hybrid</option>
              <option value="bess">BESS</option>
            </select>
          </Field>

          <Field id="project-status" label="Status" error={fields.status}>
            <select
              id="project-status"
              name="status"
              value={values.status}
              onChange={(event) =>
                update("status", event.target.value as ProjectStatus)
              }
              className={`${inputClass(fields.status)} bg-[#010609]`}
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </Field>
        </div>

        <Field
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
            className={inputClass(fields.capacityMw)}
          />
        </Field>

        <Field
          id="project-description"
          label="Description"
          error={fields.description}
        >
          <textarea
            id="project-description"
            name="description"
            rows={4}
            placeholder="Optional notes about this project..."
            value={values.description}
            onChange={(event) => update("description", event.target.value)}
            className={inputClass(fields.description, "h-auto min-h-[110px] py-3")}
          />
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e6740a] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#f0821a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating project…
            </>
          ) : (
            "Create Project"
          )}
        </button>
      </form>
    </DashboardShell>
  );
}
