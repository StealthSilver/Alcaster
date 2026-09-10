import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { FormField } from "@/components/dashboard/FormField";
import {
  formControlClass,
  panelClass,
  sectionTitleClass,
} from "@/components/dashboard/panel";
import {
  TwinBuildActions,
  TwinPhaseMap,
} from "@/components/twin/TwinPhaseMap";
import {
  ApiError,
  createProjectTwinRequest,
  type Project,
  type Site,
  type TwinRecord,
  type TwinSpec,
} from "@/lib/api";
import {
  applyDerived,
  clearDraft,
  defaultsFromProject,
  missingRequiredFields,
  phaseById,
  readDraft,
  toTwinPayload,
  TWIN_PHASES,
  validatePhase,
  visiblePhaseFields,
  writeDraft,
  type TwinFormKey,
  type TwinFormValues,
  type TwinPhaseId,
} from "@/lib/twinForm";

type CreateTwinFormProps = {
  project: Project;
  site: Site | null;
  sites: Site[];
  organizationName: string | null;
  existing?: TwinSpec;
  onCreated: (twin: TwinRecord) => void;
  onCancel?: () => void;
  onHeaderActions?: (actions: ReactNode | null) => void;
};

export function CreateTwinForm({
  project,
  site,
  sites,
  organizationName,
  existing,
  onCreated,
  onCancel,
  onHeaderActions,
}: CreateTwinFormProps) {
  const initial = useMemo(() => {
    const generated = defaultsFromProject(
      project,
      site,
      organizationName,
      existing,
    );
    const draft = readDraft(project.id);
    if (existing || !draft) {
      return {
        values: applyDerived(generated, {}),
        phaseId: "plant" as TwinPhaseId,
        unlocked: existing
          ? TWIN_PHASES.map((phase) => phase.id)
          : (["plant"] as TwinPhaseId[]),
      };
    }
    return {
      values: applyDerived({ ...generated, ...draft.values }, {}),
      phaseId: draft.phaseId,
      unlocked: Array.from(new Set(["plant", ...draft.unlocked])) as TwinPhaseId[],
    };
  }, [existing, organizationName, project, site]);

  const [values, setValues] = useState<TwinFormValues>(initial.values);
  const [touched, setTouched] = useState<Partial<Record<TwinFormKey, boolean>>>(
    {},
  );
  const [phaseId, setPhaseId] = useState<TwinPhaseId>(initial.phaseId);
  const [unlocked, setUnlocked] = useState<TwinPhaseId[]>(initial.unlocked);
  const [fields, setFields] = useState<Partial<Record<TwinFormKey, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [focusKey, setFocusKey] = useState<TwinFormKey | null>(null);

  const phase = phaseById(phaseId);
  const phaseIndex = TWIN_PHASES.findIndex((item) => item.id === phaseId);
  const lastPhase = phaseIndex === TWIN_PHASES.length - 1;
  const visible = visiblePhaseFields(phase, values);
  const missing = useMemo(() => missingRequiredFields(values), [values]);

  useEffect(() => {
    if (!site) return;
    setValues((prev) => {
      const next = { ...prev };
      let changed = false;
      if (!touched.latitude && !prev.latitude.trim()) {
        next.latitude = String(site.latitude);
        changed = true;
      }
      if (!touched.longitude && !prev.longitude.trim()) {
        next.longitude = String(site.longitude);
        changed = true;
      }
      if (!touched.location && !prev.location.trim()) {
        next.location = site.address;
        changed = true;
      }
      if (!touched.developerOwner && !prev.developerOwner.trim()) {
        next.developerOwner = organizationName ?? site.organizationName ?? "";
        changed = true;
      }
      return changed ? applyDerived(next, touched) : prev;
    });
  }, [organizationName, site, touched]);

  function persist(
    nextValues: TwinFormValues,
    nextPhase: TwinPhaseId,
    nextUnlocked: TwinPhaseId[],
  ) {
    writeDraft(project.id, {
      values: nextValues,
      phaseId: nextPhase,
      unlocked: nextUnlocked,
    });
  }

  function update<K extends TwinFormKey>(key: K, value: TwinFormValues[K]) {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setValues((prev) => {
      const next = applyDerived({ ...prev, [key]: value }, { ...touched, [key]: true });
      if (key === "siteId") {
        const selected = sites.find((item) => item.id === value);
        if (selected) {
          if (!touched.location) next.location = selected.address;
          if (!touched.latitude) next.latitude = String(selected.latitude);
          if (!touched.longitude) next.longitude = String(selected.longitude);
        }
      }
      persist(next, phaseId, unlocked);
      return next;
    });
    if (fields[key]) setFields((prev) => ({ ...prev, [key]: undefined }));
  }

  useEffect(() => {
    if (!focusKey) return;
    const field = document.getElementById(`twin-field-${focusKey}`);
    const node = document.getElementById(`twin-${focusKey}`);
    (field ?? node)?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (node instanceof HTMLElement) node.focus();
    setFocusKey(null);
  }, [focusKey, phaseId]);

  function goTo(nextId: TwinPhaseId) {
    if (!unlocked.includes(nextId)) return;
    setPhaseId(nextId);
    setFields({});
    setFormError(null);
    persist(values, nextId, unlocked);
  }

  function unlockThrough(targetId: TwinPhaseId) {
    const index = TWIN_PHASES.findIndex((item) => item.id === targetId);
    return Array.from(
      new Set([
        ...unlocked,
        ...TWIN_PHASES.slice(0, Math.max(index, 0) + 1).map((item) => item.id),
      ]),
    ) as TwinPhaseId[];
  }

  function jumpToField(targetPhase: TwinPhaseId, key: TwinFormKey) {
    const nextUnlocked = unlockThrough(targetPhase);
    setUnlocked(nextUnlocked);
    setPhaseId(targetPhase);
    setFields(validatePhase(phaseById(targetPhase), values));
    setFormError(null);
    persist(values, targetPhase, nextUnlocked);
    setFocusKey(key);
  }

  async function submitTwin() {
    const blockers = missingRequiredFields(values);
    if (blockers.length > 0) {
      jumpToField(blockers[0].phaseId, blockers[0].key);
      setFormError("Complete the required fields before building the model.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const { twin } = await createProjectTwinRequest(
        project.id,
        toTwinPayload(values),
      );
      clearDraft(project.id);
      onCreated(twin);
    } catch (error) {
      if (error instanceof ApiError) {
        setFields(error.fields as Partial<Record<TwinFormKey, string>>);
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function savePhase() {
    setFormError(null);
    const nextFields = validatePhase(phase, values);
    setFields(nextFields);
    if (Object.keys(nextFields).length > 0) return;

    const nextUnlocked = Array.from(new Set(unlocked));
    const upcoming = TWIN_PHASES[phaseIndex + 1];
    if (upcoming && !nextUnlocked.includes(upcoming.id)) {
      nextUnlocked.push(upcoming.id);
    }
    setUnlocked(nextUnlocked);

    if (!lastPhase && upcoming) {
      setPhaseId(upcoming.id);
      persist(values, upcoming.id, nextUnlocked);
      return;
    }

    await submitTwin();
  }

  const submitRef = useRef(submitTwin);
  submitRef.current = submitTwin;
  const jumpRef = useRef(jumpToField);
  jumpRef.current = jumpToField;

  useEffect(() => {
    if (!onHeaderActions) return;
    onHeaderActions(
      <TwinBuildActions
        existing={Boolean(existing)}
        submitting={submitting}
        missing={missing}
        onBuild={() => void submitRef.current()}
        onJumpToField={(targetPhase, key) => jumpRef.current(targetPhase, key)}
      />,
    );
    return () => onHeaderActions(null);
  }, [existing, missing, onHeaderActions, submitting]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <TwinPhaseMap
        values={values}
        current={phaseId}
        unlocked={unlocked}
        onSelect={goTo}
      />

      {formError ? (
        <p
          role="alert"
          className="shrink-0 rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {formError}
        </p>
      ) : null}

      <div className={`${panelClass} flex min-h-0 flex-1 flex-col overflow-hidden`}>
        <div className="border-b border-edge px-4 py-2.5 sm:px-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
            Phase {phaseIndex + 1} of {TWIN_PHASES.length}
          </p>
          <h2 className={`mt-0.5 ${sectionTitleClass}`}>{phase.title}</h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 items-start gap-x-4 gap-y-3 sm:grid-cols-2">
            {visible.map((field) => {
              const error = fields[field.key];
              const span =
                field.type === "textarea" || field.key === "description"
                  ? "sm:col-span-2"
                  : "";
              return (
                <div
                  key={field.key}
                  id={`twin-field-${field.key}`}
                  className={`flex flex-col ${span}`}
                >
                  <FormField
                    id={`twin-${field.key}`}
                    label={field.label}
                    error={error}
                    required={field.required}
                  >
                    <PhaseControl
                      field={field}
                      values={values}
                      sites={sites}
                      error={error}
                      onChange={update}
                    />
                  </FormField>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-edge px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            {phaseIndex > 0 ? (
              <button
                type="button"
                onClick={() => goTo(TWIN_PHASES[phaseIndex - 1].id)}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </button>
            ) : onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex h-8 items-center rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
              >
                Cancel
              </button>
            ) : null}
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void savePhase()}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : lastPhase ? (
              existing ? (
                "Save & rebuild twin"
              ) : (
                "Save & create twin"
              )
            ) : (
              <>
                Save & continue
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function PhaseControl({
  field,
  values,
  sites,
  error,
  onChange,
}: {
  field: (typeof TWIN_PHASES)[number]["fields"][number];
  values: TwinFormValues;
  sites: Site[];
  error?: string;
  onChange: <K extends TwinFormKey>(key: K, value: TwinFormValues[K]) => void;
}) {
  const id = `twin-${field.key}`;
  const value = String(values[field.key] ?? "");
  const controlClass = formControlClass(error, field.readOnly ? "opacity-80" : "");

  if (field.key === "siteId") {
    return (
      <select
        id={id}
        value={value}
        onChange={(event) => onChange("siteId", event.target.value)}
        className={controlClass}
      >
        {sites.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
        {sites.some((item) => item.id === value) ? null : (
          <option value={value}>{value || "Select a site"}</option>
        )}
      </select>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        id={id}
        rows={3}
        value={value}
        readOnly={field.readOnly}
        onChange={(event) =>
          onChange(field.key, event.target.value as TwinFormValues[typeof field.key])
        }
        className={`${controlClass} h-auto min-h-[76px] py-2`}
      />
    );
  }

  if (field.type === "select" || field.type === "yesno") {
    return (
      <select
        id={id}
        value={value}
        disabled={field.readOnly}
        onChange={(event) =>
          onChange(field.key, event.target.value as TwinFormValues[typeof field.key])
        }
        className={controlClass}
      >
        {(field.options ?? []).map((option) => (
          <option key={option.value || "empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "file") {
    return (
      <FileNameInput
        id={id}
        value={value}
        error={error}
        onChange={(name) =>
          onChange(field.key, name as TwinFormValues[typeof field.key])
        }
      />
    );
  }

  return (
    <input
      id={id}
      type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
      min={field.min}
      max={field.max}
      step={field.step}
      value={value}
      readOnly={field.readOnly}
      onChange={(event) =>
        onChange(field.key, event.target.value as TwinFormValues[typeof field.key])
      }
      className={controlClass}
    />
  );
}

function FileNameInput({
  id,
  value,
  error,
  onChange,
}: {
  id: string;
  value: string;
  error?: string;
  onChange: (name: string) => void;
}) {
  function handle(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    onChange(file?.name ?? "");
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        className={`${formControlClass(error)} flex cursor-pointer items-center text-muted`}
      >
        <span className="truncate">{value || "Choose file"}</span>
      </label>
      <input id={id} type="file" className="sr-only" onChange={handle} />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="shrink-0 text-xs text-muted hover:text-fg"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
