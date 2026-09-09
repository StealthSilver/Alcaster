import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Field } from "@/components/auth/Field";
import { inputClass } from "@/components/auth/inputClass";
import { DashboardShell } from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { ApiError, createSiteRequest, type SiteStatus } from "@/lib/api";

type FormValues = {
  name: string;
  location: string;
  status: SiteStatus;
  description: string;
};

const emptyValues: FormValues = {
  name: "",
  location: "",
  status: "active",
  description: "",
};

function validate(values: FormValues) {
  const fields: Partial<Record<keyof FormValues, string>> = {};
  if (!values.name.trim()) fields.name = "Site name is required.";
  else if (values.name.trim().length < 2) fields.name = "Enter a site name.";
  if (!values.location.trim()) fields.location = "Location is required.";
  else if (values.location.trim().length < 2) fields.location = "Enter a location.";
  return fields;
}

export function CreateSitePage() {
  const { user } = useAuth();
  const { refreshSites, selectSite } = useWorkspace();
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>(emptyValues);
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
    if (Object.keys(nextFields).length > 0) return;

    setSubmitting(true);
    try {
      const { site } = await createSiteRequest({
        name: values.name.trim(),
        location: values.location.trim(),
        status: values.status,
        description: values.description.trim(),
      });
      await refreshSites();
      selectSite(site.id);
      void navigate("/sites", { replace: true });
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
      title="Create Site"
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

        <Field id="site-name" label="Site Name" error={fields.name}>
          <input
            id="site-name"
            name="name"
            placeholder="Karnataka Solar Complex"
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            className={inputClass(fields.name)}
          />
        </Field>

        <Field id="site-location" label="Location" error={fields.location}>
          <input
            id="site-location"
            name="location"
            placeholder="Karnataka"
            value={values.location}
            onChange={(event) => update("location", event.target.value)}
            className={inputClass(fields.location)}
          />
        </Field>

        <Field id="site-status" label="Status" error={fields.status}>
          <select
            id="site-status"
            name="status"
            value={values.status}
            onChange={(event) =>
              update("status", event.target.value as SiteStatus)
            }
            className={`${inputClass(fields.status)} bg-[#010609]`}
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="on_hold">On Hold</option>
          </select>
        </Field>

        <Field id="site-description" label="Description" error={fields.description}>
          <textarea
            id="site-description"
            name="description"
            rows={4}
            placeholder="Optional notes about this site..."
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
              Creating site…
            </>
          ) : (
            "Create Site"
          )}
        </button>
      </form>
    </DashboardShell>
  );
}
