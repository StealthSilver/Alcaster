import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Field } from "@/components/auth/Field";
import { inputClass } from "@/components/auth/inputClass";
import {
  ApiError,
  createProjectTwinRequest,
  type InverterKind,
  type ModuleTech,
  type MountingType,
  type Project,
  type TwinRecord,
  type TwinSpec,
} from "@/lib/api";

type FormValues = {
  capacityMw: string;
  landAreaAcres: string;
  usableLandPct: string;
  latitude: string;
  longitude: string;
  dcAcRatio: string;
  moduleWattageW: string;
  moduleTech: ModuleTech;
  tiltDeg: string;
  azimuthDeg: string;
  mountingType: MountingType;
  groundCoverageRatio: string;
  modulesPerString: string;
  inverterType: InverterKind;
  inverterRatingKw: string;
  transformerMva: string;
  mvVoltageKv: string;
  gridVoltageKv: string;
  includeBuilding: boolean;
  includeWeatherStation: boolean;
  includeFence: boolean;
  includeRoads: boolean;
};

type FormKey = keyof FormValues;

function defaultsFromProject(project: Project, existing?: TwinSpec): FormValues {
  const spec = existing;
  const capacity = spec?.capacityMw ?? project.capacityMw;
  return {
    capacityMw: String(capacity),
    landAreaAcres: String(spec?.landAreaAcres ?? Math.round(capacity * 4.5 * 10) / 10),
    usableLandPct: String(spec?.usableLandPct ?? 85),
    latitude: String(spec?.latitude ?? 15.32),
    longitude: String(spec?.longitude ?? 76.46),
    dcAcRatio: String(spec?.dcAcRatio ?? 1.3),
    moduleWattageW: String(spec?.moduleWattageW ?? 550),
    moduleTech: spec?.moduleTech ?? "topcon",
    tiltDeg: String(spec?.tiltDeg ?? 22),
    azimuthDeg: String(spec?.azimuthDeg ?? 180),
    mountingType: spec?.mountingType ?? "single_axis",
    groundCoverageRatio: String(spec?.groundCoverageRatio ?? 0.4),
    modulesPerString: String(spec?.modulesPerString ?? 28),
    inverterType: spec?.inverterType ?? "central",
    inverterRatingKw: String(spec?.inverterRatingKw ?? 2500),
    transformerMva: String(spec?.transformerMva ?? Math.max(10, Math.round(capacity * 1.1))),
    mvVoltageKv: String(spec?.mvVoltageKv ?? 33),
    gridVoltageKv: String(spec?.gridVoltageKv ?? 132),
    includeBuilding: spec?.includeBuilding ?? true,
    includeWeatherStation: spec?.includeWeatherStation ?? true,
    includeFence: spec?.includeFence ?? true,
    includeRoads: spec?.includeRoads ?? true,
  };
}

function toNumber(value: string) {
  return Number(value);
}

function validate(values: FormValues) {
  const fields: Partial<Record<FormKey, string>> = {};
  const required: Array<[FormKey, string, number, number]> = [
    ["capacityMw", "Capacity", 0.1, 5000],
    ["landAreaAcres", "Land area", 0.5, 50000],
    ["usableLandPct", "Usable land", 40, 100],
    ["latitude", "Latitude", -90, 90],
    ["longitude", "Longitude", -180, 180],
    ["dcAcRatio", "DC/AC ratio", 1, 1.8],
    ["moduleWattageW", "Module wattage", 250, 800],
    ["tiltDeg", "Tilt", 0, 60],
    ["azimuthDeg", "Azimuth", 0, 360],
    ["groundCoverageRatio", "GCR", 0.2, 0.7],
    ["modulesPerString", "Modules per string", 8, 40],
    ["inverterRatingKw", "Inverter rating", 20, 5000],
    ["transformerMva", "Transformer rating", 1, 1000],
    ["mvVoltageKv", "MV voltage", 11, 66],
    ["gridVoltageKv", "Grid voltage", 33, 400],
  ];
  for (const [key, label, min, max] of required) {
    const raw = values[key];
    if (typeof raw !== "string" || raw.trim() === "") {
      fields[key] = `${label} is required.`;
      continue;
    }
    const n = Number(raw);
    if (Number.isNaN(n) || n < min || n > max) {
      fields[key] = `Enter a valid ${label.toLowerCase()}.`;
    }
  }
  return fields;
}

function toPayload(values: FormValues): TwinSpec {
  return {
    capacityMw: toNumber(values.capacityMw),
    landAreaAcres: toNumber(values.landAreaAcres),
    usableLandPct: toNumber(values.usableLandPct),
    latitude: toNumber(values.latitude),
    longitude: toNumber(values.longitude),
    dcAcRatio: toNumber(values.dcAcRatio),
    moduleWattageW: toNumber(values.moduleWattageW),
    moduleTech: values.moduleTech,
    tiltDeg: toNumber(values.tiltDeg),
    azimuthDeg: toNumber(values.azimuthDeg),
    mountingType: values.mountingType,
    groundCoverageRatio: toNumber(values.groundCoverageRatio),
    modulesPerString: Math.round(toNumber(values.modulesPerString)),
    inverterType: values.inverterType,
    inverterRatingKw: toNumber(values.inverterRatingKw),
    transformerMva: toNumber(values.transformerMva),
    mvVoltageKv: toNumber(values.mvVoltageKv),
    gridVoltageKv: toNumber(values.gridVoltageKv),
    includeBuilding: values.includeBuilding,
    includeWeatherStation: values.includeWeatherStation,
    includeFence: values.includeFence,
    includeRoads: values.includeRoads,
  };
}

type CreateTwinFormProps = {
  project: Project;
  existing?: TwinSpec;
  onCreated: (twin: TwinRecord) => void;
  onCancel?: () => void;
};

export function CreateTwinForm({
  project,
  existing,
  onCreated,
  onCancel,
}: CreateTwinFormProps) {
  const [values, setValues] = useState<FormValues>(() =>
    defaultsFromProject(project, existing),
  );
  const [fields, setFields] = useState<Partial<Record<FormKey, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends FormKey>(key: K, value: FormValues[K]) {
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
      const { twin } = await createProjectTwinRequest(project.id, toPayload(values));
      onCreated(twin);
    } catch (error) {
      if (error instanceof ApiError) {
        setFields(error.fields as Partial<Record<FormKey, string>>);
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const dcMw =
    Number(values.capacityMw) * Number(values.dcAcRatio || 0) || 0;
  const modules =
    values.moduleWattageW && dcMw
      ? Math.round((dcMw * 1_000_000) / Number(values.moduleWattageW))
      : 0;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {formError ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {formError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <Section title="Site & land" note="Plot size and location used to scale the sitemap.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="twin-capacity" label="AC capacity (MW)" error={fields.capacityMw}>
                <input
                  id="twin-capacity"
                  type="number"
                  min={0.1}
                  step="0.1"
                  value={values.capacityMw}
                  onChange={(e) => update("capacityMw", e.target.value)}
                  className={inputClass(fields.capacityMw)}
                />
              </Field>
              <Field id="twin-land" label="Land area (acres)" error={fields.landAreaAcres}>
                <input
                  id="twin-land"
                  type="number"
                  min={0.5}
                  step="0.1"
                  value={values.landAreaAcres}
                  onChange={(e) => update("landAreaAcres", e.target.value)}
                  className={inputClass(fields.landAreaAcres)}
                />
              </Field>
              <Field id="twin-usable" label="Usable land (%)" error={fields.usableLandPct}>
                <input
                  id="twin-usable"
                  type="number"
                  min={40}
                  max={100}
                  step="1"
                  value={values.usableLandPct}
                  onChange={(e) => update("usableLandPct", e.target.value)}
                  className={inputClass(fields.usableLandPct)}
                />
              </Field>
              <Field id="twin-lat" label="Latitude" error={fields.latitude}>
                <input
                  id="twin-lat"
                  type="number"
                  step="0.0001"
                  value={values.latitude}
                  onChange={(e) => update("latitude", e.target.value)}
                  className={inputClass(fields.latitude)}
                />
              </Field>
              <Field id="twin-lng" label="Longitude" error={fields.longitude}>
                <input
                  id="twin-lng"
                  type="number"
                  step="0.0001"
                  value={values.longitude}
                  onChange={(e) => update("longitude", e.target.value)}
                  className={inputClass(fields.longitude)}
                />
              </Field>
            </div>
          </Section>

          <Section title="Array geometry" note="Module, tilt, and mounting drive how tables are laid out.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="twin-dcac" label="DC/AC ratio" error={fields.dcAcRatio}>
                <input
                  id="twin-dcac"
                  type="number"
                  min={1}
                  max={1.8}
                  step="0.01"
                  value={values.dcAcRatio}
                  onChange={(e) => update("dcAcRatio", e.target.value)}
                  className={inputClass(fields.dcAcRatio)}
                />
              </Field>
              <Field id="twin-modw" label="Module wattage (W)" error={fields.moduleWattageW}>
                <input
                  id="twin-modw"
                  type="number"
                  min={250}
                  max={800}
                  step="5"
                  value={values.moduleWattageW}
                  onChange={(e) => update("moduleWattageW", e.target.value)}
                  className={inputClass(fields.moduleWattageW)}
                />
              </Field>
              <Field id="twin-tech" label="Module technology">
                <select
                  id="twin-tech"
                  value={values.moduleTech}
                  onChange={(e) => update("moduleTech", e.target.value as ModuleTech)}
                  className={inputClass()}
                >
                  <option value="mono_perc">Mono PERC</option>
                  <option value="topcon">TOPCon</option>
                  <option value="bifacial">Bifacial</option>
                </select>
              </Field>
              <Field id="twin-mount" label="Mounting">
                <select
                  id="twin-mount"
                  value={values.mountingType}
                  onChange={(e) =>
                    update("mountingType", e.target.value as MountingType)
                  }
                  className={inputClass()}
                >
                  <option value="single_axis">Single-axis tracker</option>
                  <option value="fixed_tilt">Fixed tilt</option>
                </select>
              </Field>
              <Field id="twin-tilt" label="Tilt (°)" error={fields.tiltDeg}>
                <input
                  id="twin-tilt"
                  type="number"
                  min={0}
                  max={60}
                  step="1"
                  value={values.tiltDeg}
                  onChange={(e) => update("tiltDeg", e.target.value)}
                  className={inputClass(fields.tiltDeg)}
                />
              </Field>
              <Field id="twin-az" label="Azimuth (°)" error={fields.azimuthDeg}>
                <input
                  id="twin-az"
                  type="number"
                  min={0}
                  max={360}
                  step="1"
                  value={values.azimuthDeg}
                  onChange={(e) => update("azimuthDeg", e.target.value)}
                  className={inputClass(fields.azimuthDeg)}
                />
              </Field>
              <Field id="twin-gcr" label="Ground coverage ratio" error={fields.groundCoverageRatio}>
                <input
                  id="twin-gcr"
                  type="number"
                  min={0.2}
                  max={0.7}
                  step="0.01"
                  value={values.groundCoverageRatio}
                  onChange={(e) => update("groundCoverageRatio", e.target.value)}
                  className={inputClass(fields.groundCoverageRatio)}
                />
              </Field>
              <Field id="twin-mps" label="Modules per string" error={fields.modulesPerString}>
                <input
                  id="twin-mps"
                  type="number"
                  min={8}
                  max={40}
                  step="1"
                  value={values.modulesPerString}
                  onChange={(e) => update("modulesPerString", e.target.value)}
                  className={inputClass(fields.modulesPerString)}
                />
              </Field>
            </div>
          </Section>

          <Section title="Electrical & grid" note="Inverters, MV collection, and the interconnection voltage.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="twin-invt" label="Inverter type">
                <select
                  id="twin-invt"
                  value={values.inverterType}
                  onChange={(e) =>
                    update("inverterType", e.target.value as InverterKind)
                  }
                  className={inputClass()}
                >
                  <option value="central">Central</option>
                  <option value="string">String</option>
                </select>
              </Field>
              <Field id="twin-invr" label="Inverter rating (kW)" error={fields.inverterRatingKw}>
                <input
                  id="twin-invr"
                  type="number"
                  min={20}
                  max={5000}
                  step="10"
                  value={values.inverterRatingKw}
                  onChange={(e) => update("inverterRatingKw", e.target.value)}
                  className={inputClass(fields.inverterRatingKw)}
                />
              </Field>
              <Field id="twin-xfmr" label="Transformer (MVA)" error={fields.transformerMva}>
                <input
                  id="twin-xfmr"
                  type="number"
                  min={1}
                  max={1000}
                  step="0.5"
                  value={values.transformerMva}
                  onChange={(e) => update("transformerMva", e.target.value)}
                  className={inputClass(fields.transformerMva)}
                />
              </Field>
              <Field id="twin-mv" label="MV collection (kV)" error={fields.mvVoltageKv}>
                <input
                  id="twin-mv"
                  type="number"
                  min={11}
                  max={66}
                  step="1"
                  value={values.mvVoltageKv}
                  onChange={(e) => update("mvVoltageKv", e.target.value)}
                  className={inputClass(fields.mvVoltageKv)}
                />
              </Field>
              <Field id="twin-grid" label="Grid voltage (kV)" error={fields.gridVoltageKv}>
                <input
                  id="twin-grid"
                  type="number"
                  min={33}
                  max={400}
                  step="1"
                  value={values.gridVoltageKv}
                  onChange={(e) => update("gridVoltageKv", e.target.value)}
                  className={inputClass(fields.gridVoltageKv)}
                />
              </Field>
            </div>
          </Section>

          <Section title="Civil works" note="Site features drawn into the dummy twin.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Check
                id="twin-roads"
                label="Internal roads"
                checked={values.includeRoads}
                onChange={(v) => update("includeRoads", v)}
              />
              <Check
                id="twin-fence"
                label="Perimeter fence"
                checked={values.includeFence}
                onChange={(v) => update("includeFence", v)}
              />
              <Check
                id="twin-bldg"
                label="O&M building"
                checked={values.includeBuilding}
                onChange={(v) => update("includeBuilding", v)}
              />
              <Check
                id="twin-met"
                label="Weather station"
                checked={values.includeWeatherStation}
                onChange={(v) => update("includeWeatherStation", v)}
              />
            </div>
          </Section>
        </div>

        <aside className="h-fit rounded-2xl border border-edge bg-fill p-5 xl:sticky xl:top-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
            Estimated plant
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <Stat label="DC capacity" value={`${dcMw ? dcMw.toFixed(1) : "—"} MWp`} />
            <Stat label="Modules" value={modules ? modules.toLocaleString() : "—"} />
            <Stat
              label="Strings"
              value={
                modules && Number(values.modulesPerString)
                  ? Math.ceil(modules / Number(values.modulesPerString)).toLocaleString()
                  : "—"
              }
            />
            <Stat
              label="Inverters"
              value={
                Number(values.capacityMw) && Number(values.inverterRatingKw)
                  ? String(
                      Math.max(
                        1,
                        Math.round(
                          (Number(values.capacityMw) * 1000) /
                            Number(values.inverterRatingKw),
                        ),
                      ),
                    )
                  : "—"
              }
            />
          </dl>
          <p className="mt-5 text-xs leading-relaxed text-muted">
            The twin is a dummy spatial model generated from these parameters — not
            surveyed as-built geometry.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Building twin…
              </>
            ) : existing ? (
              "Rebuild digital twin"
            ) : (
              "Create digital twin"
            )}
          </button>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl border border-edge text-sm font-medium text-secondary transition-colors hover:bg-fill hover:text-fg"
            >
              Cancel
            </button>
          ) : null}
        </aside>
      </div>
    </form>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-edge bg-fill p-5 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight text-fg">{title}</h2>
      <p className="mt-1 text-sm text-muted">{note}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold tabular-nums text-fg">{value}</dd>
    </div>
  );
}

function Check({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 text-sm text-secondary">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-edge-strong bg-transparent accent-[#e6740a]"
      />
      {label}
    </label>
  );
}
