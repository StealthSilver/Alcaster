import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { DashboardShell } from "@/components/dashboard";
import { FormField } from "@/components/dashboard/FormField";
import { formControlClass, panelClass } from "@/components/dashboard/panel";
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

  return (
    <DashboardShell user={shellUser} title="Create site">
      <div className="max-w-2xl">
        <p className="mb-5 text-sm text-muted">
          Add a site to group projects, plants, and operational data.
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
              id="site-name"
              label="Name"
              hint="A unique name for this site."
              error={fields.name}
            >
              <input
                id="site-name"
                name="name"
                placeholder="Karnataka Solar Complex"
                value={values.name}
                onChange={(event) => update("name", event.target.value)}
                className={formControlClass(fields.name)}
              />
            </FormField>

            <FormField
              id="site-location"
              label="Location"
              hint="Region or state where this site operates."
              error={fields.location}
            >
              <input
                id="site-location"
                name="location"
                placeholder="Karnataka"
                value={values.location}
                onChange={(event) => update("location", event.target.value)}
                className={formControlClass(fields.location)}
              />
            </FormField>

            <FormField id="site-status" label="Status" error={fields.status}>
              <select
                id="site-status"
                name="status"
                value={values.status}
                onChange={(event) =>
                  update("status", event.target.value as SiteStatus)
                }
                className={formControlClass(fields.status)}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="on_hold">On Hold</option>
              </select>
            </FormField>

            <FormField
              id="site-description"
              label="Description"
              hint="Optional. Shown on the sites list."
              error={fields.description}
            >
              <textarea
                id="site-description"
                name="description"
                rows={3}
                placeholder="Notes about this site"
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
              to="/sites"
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
                "Create site"
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
