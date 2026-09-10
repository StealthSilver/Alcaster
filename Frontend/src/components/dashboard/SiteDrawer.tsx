import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { FormField } from "@/components/dashboard/FormField";
import { formControlClass } from "@/components/dashboard/panel";
import {
  ApiError,
  createSiteRequest,
  updateSiteRequest,
  type Site,
  type SiteStatus,
  type SiteType,
} from "@/lib/api";

import { Drawer } from "./Drawer";

type SiteFormValues = {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  type: SiteType;
  status: SiteStatus;
};

const emptyValues: SiteFormValues = {
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  type: "solar",
  status: "active",
};

function valuesFromSite(site: Site): SiteFormValues {
  return {
    name: site.name,
    address: site.address,
    latitude: String(site.latitude),
    longitude: String(site.longitude),
    type: site.type,
    status: site.status,
  };
}

function validate(values: SiteFormValues) {
  const fields: Partial<Record<keyof SiteFormValues, string>> = {};
  if (!values.name.trim()) fields.name = "Site name is required.";
  else if (values.name.trim().length < 2) fields.name = "Enter a site name.";

  if (!values.address.trim()) fields.address = "Address is required.";
  else if (values.address.trim().length < 2) fields.address = "Enter an address.";

  if (!values.latitude.trim()) fields.latitude = "Latitude is required.";
  else {
    const latitude = Number(values.latitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      fields.latitude = "Enter a valid latitude.";
    }
  }

  if (!values.longitude.trim()) fields.longitude = "Longitude is required.";
  else {
    const longitude = Number(values.longitude);
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      fields.longitude = "Enter a valid longitude.";
    }
  }

  return fields;
}

type SiteDrawerProps = {
  open: boolean;
  site?: Site | null;
  onClose: () => void;
  onSaved: (site: Site) => void;
};

export function SiteDrawer({ open, site, onClose, onSaved }: SiteDrawerProps) {
  const editing = Boolean(site);
  const [values, setValues] = useState<SiteFormValues>(emptyValues);
  const [fields, setFields] = useState<Partial<Record<keyof SiteFormValues, string>>>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(site ? valuesFromSite(site) : emptyValues);
    setFields({});
    setFormError(null);
    setSubmitting(false);
  }, [open, site]);

  function update<K extends keyof SiteFormValues>(key: K, value: SiteFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (fields[key]) setFields((prev) => ({ ...prev, [key]: undefined }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const nextFields = validate(values);
    setFields(nextFields);
    if (Object.keys(nextFields).length > 0) return;

    const payload = {
      name: values.name.trim(),
      address: values.address.trim(),
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
      type: values.type,
      status: values.status,
    };

    setSubmitting(true);
    try {
      const result = site
        ? await updateSiteRequest(site.id, payload)
        : await createSiteRequest(payload);
      onSaved(result.site);
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
      title={editing ? "Edit site" : "Create site"}
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
            form="site-drawer-form"
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
              "Create site"
            )}
          </button>
        </div>
      }
    >
      <form id="site-drawer-form" onSubmit={onSubmit} noValidate>
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
            label="Site Name"
            required
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
            id="site-address"
            label="Address"
            required
            error={fields.address}
          >
            <textarea
              id="site-address"
              name="address"
              rows={3}
              placeholder="Pavagada Solar Park, Tumakuru, Karnataka, India"
              value={values.address}
              onChange={(event) => update("address", event.target.value)}
              className={formControlClass(fields.address, "h-auto min-h-[80px] py-2")}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="site-latitude"
              label="Latitude"
              required
              error={fields.latitude}
            >
              <input
                id="site-latitude"
                name="latitude"
                inputMode="decimal"
                placeholder="14.10"
                value={values.latitude}
                onChange={(event) => update("latitude", event.target.value)}
                className={formControlClass(fields.latitude)}
              />
            </FormField>
            <FormField
              id="site-longitude"
              label="Longitude"
              required
              error={fields.longitude}
            >
              <input
                id="site-longitude"
                name="longitude"
                inputMode="decimal"
                placeholder="77.28"
                value={values.longitude}
                onChange={(event) => update("longitude", event.target.value)}
                className={formControlClass(fields.longitude)}
              />
            </FormField>
          </div>

          <FormField id="site-type" label="Type" required error={fields.type}>
            <select
              id="site-type"
              name="type"
              value={values.type}
              onChange={(event) => update("type", event.target.value as SiteType)}
              className={formControlClass(fields.type)}
            >
              <option value="solar">Solar</option>
              <option value="wind">Wind</option>
              <option value="bess">BESS</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </FormField>

          <FormField id="site-status" label="Status" required error={fields.status}>
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
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
        </div>
      </form>
    </Drawer>
  );
}
