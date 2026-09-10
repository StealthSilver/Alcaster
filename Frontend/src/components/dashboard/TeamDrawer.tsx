import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Loader2 } from "lucide-react";

import { FormField } from "@/components/dashboard/FormField";
import { formControlClass } from "@/components/dashboard/panel";
import { useAuth } from "@/context/AuthContext";
import {
  ApiError,
  createTeamMemberRequest,
  createUserRequest,
  updateTeamMemberRequest,
  updateUserRequest,
  type Site,
  type TeamMember,
} from "@/lib/api";
import { canAssignAdmin, isAdmin } from "@/lib/roles";
import {
  ACCESS_ROLES,
  GENDERS,
  TEAM_PASSWORD_HINT,
  isTeamPassword,
  type AccessRole,
  type Gender,
} from "@/lib/validation";
import { siteTypeLabel } from "@/lib/labels";

import { Drawer } from "./Drawer";

type TeamFormValues = {
  name: string;
  email: string;
  password: string;
  role: string;
  gender: Gender | "";
  designation: string;
  company: string;
  siteIds: string[];
};

function emptyValues(siteId: string | null, company: string): TeamFormValues {
  return {
    name: "",
    email: "",
    password: "",
    role: "Site Engineer",
    gender: "",
    designation: "",
    company,
    siteIds: siteId ? [siteId] : [],
  };
}

function formRole(role: string): string {
  if (ACCESS_ROLES.includes(role as AccessRole)) return role;
  if (isAdmin(role)) return role;
  return "Site Engineer";
}

function valuesFromMember(member: TeamMember): TeamFormValues {
  const gender = GENDERS.includes(member.gender as Gender)
    ? (member.gender as Gender)
    : "";
  return {
    name: member.name,
    email: member.email,
    password: "",
    role: formRole(member.role),
    gender,
    designation: member.designation,
    company: member.company,
    siteIds: member.siteIds,
  };
}

function validate(values: TeamFormValues, editing: boolean) {
  const fields: Partial<Record<keyof TeamFormValues, string>> = {};
  if (!values.name.trim()) fields.name = "Name is required.";
  else if (values.name.trim().length < 2) fields.name = "Enter a name.";

  const email = values.email.trim();
  if (!email) fields.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fields.email = "Enter a valid email address.";
  }

  if (!editing && !values.password) fields.password = "Password is required.";
  else if (values.password && !isTeamPassword(values.password)) {
    fields.password = TEAM_PASSWORD_HINT;
  }

  if (
    !ACCESS_ROLES.includes(values.role as AccessRole) &&
    !isAdmin(values.role)
  ) {
    fields.role = "Select a role.";
  }
  if (!values.gender) fields.gender = "Select a gender.";

  if (!values.designation.trim()) fields.designation = "Designation is required.";
  else if (values.designation.trim().length < 2) {
    fields.designation = "Enter a designation.";
  }

  if (!isAdmin(values.role) && values.siteIds.length === 0) {
    fields.siteIds = "Assign at least one site.";
  }

  return fields;
}

type TeamDrawerProps = {
  open: boolean;
  member?: TeamMember | null;
  sites: Site[];
  currentSiteId: string | null;
  entity?: "member" | "user";
  onClose: () => void;
  onSaved: (member: TeamMember) => void;
};

const drawerCopy = {
  member: {
    createTitle: "Add team member",
    editTitle: "Edit team member",
    submitCreate: "Add team member",
  },
  user: {
    createTitle: "Create user",
    editTitle: "Edit user",
    submitCreate: "Create user",
  },
} as const;

function SiteAssignDropdown({
  sites,
  selectedIds,
  disabled,
  error,
  active,
  onToggle,
}: {
  sites: Site[];
  selectedIds: string[];
  disabled: boolean;
  error?: string;
  active: boolean;
  onToggle: (siteId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  function updateMenuPosition() {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;
    const openUp = spaceAbove > spaceBelow;
    const available = openUp ? spaceAbove : spaceBelow;
    const maxHeight = Math.min(192, Math.max(available, 96));
    setMenuStyle({
      position: "fixed",
      top: openUp ? rect.top - 4 - maxHeight : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      maxHeight,
      zIndex: 90,
    });
  }

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onReposition() {
      updateMenuPosition();
    }
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("resize", onReposition);
    document.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("resize", onReposition);
      document.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (disabled || !active) setOpen(false);
  }, [active, disabled]);

  const selected = sites.filter((site) => selectedIds.includes(site.id));
  const label = disabled
    ? "All sites"
    : selected.length === 0
      ? "Select sites"
      : selected.map((site) => site.name).join(", ");

  return (
    <div>
      <button
        ref={buttonRef}
        id="team-sites"
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={formControlClass(
          error,
          "flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-70",
        )}
      >
        <span
          className={`min-w-0 truncate ${
            selected.length > 0 || disabled ? "text-fg" : "text-subtle"
          }`}
        >
          {label}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              id="team-sites-menu"
              role="listbox"
              aria-multiselectable="true"
              className="overflow-y-auto rounded-md border border-edge bg-surface shadow-[var(--alcaster-shadow)]"
              style={menuStyle}
            >
              {sites.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted">
                  No sites available.
                </p>
              ) : (
                sites.map((site) => {
                  const checked = selectedIds.includes(site.id);
                  return (
                    <button
                      key={site.id}
                      type="button"
                      role="option"
                      aria-selected={checked}
                      onClick={() => onToggle(site.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg hover:bg-fill"
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          checked
                            ? "border-accent bg-accent text-on-accent"
                            : "border-edge-strong bg-input"
                        }`}
                      >
                        {checked ? (
                          <Check className="h-3 w-3" strokeWidth={3} />
                        ) : null}
                      </span>
                      <span className="min-w-0 truncate">
                        {site.name}{" "}
                        <span className="text-muted">
                          ({siteTypeLabel[site.type]})
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function TeamDrawer({
  open,
  member,
  sites,
  currentSiteId,
  entity = "member",
  onClose,
  onSaved,
}: TeamDrawerProps) {
  const { user } = useAuth();
  const editing = Boolean(member);
  const actorIsAdmin = canAssignAdmin(user?.role ?? "");
  const defaultCompany = user?.organizationName ?? "";
  const [values, setValues] = useState<TeamFormValues>(
    emptyValues(currentSiteId, defaultCompany),
  );
  const [fields, setFields] = useState<
    Partial<Record<keyof TeamFormValues, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const extraRole =
    values.role && !(ACCESS_ROLES as readonly string[]).includes(values.role)
      ? values.role
      : null;
  const roles = [
    ...(extraRole ? [extraRole] : []),
    ...(actorIsAdmin
      ? ACCESS_ROLES
      : ACCESS_ROLES.filter((role) => role !== "Admin")),
  ];
  const copy = drawerCopy[entity];

  useEffect(() => {
    if (!open) return;
    const next = member
      ? valuesFromMember(member)
      : emptyValues(currentSiteId, defaultCompany);
    if (isAdmin(next.role)) {
      next.siteIds = sites.map((site) => site.id);
    }
    setValues(next);
    setFields({});
    setFormError(null);
    setSubmitting(false);
  }, [currentSiteId, defaultCompany, member, open, sites]);

  function update<K extends keyof TeamFormValues>(
    key: K,
    value: TeamFormValues[K],
  ) {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "role" && isAdmin(String(value))) {
        next.siteIds = sites.map((site) => site.id);
      }
      return next;
    });
    if (fields[key]) setFields((prev) => ({ ...prev, [key]: undefined }));
  }

  function toggleSite(siteId: string) {
    if (isAdmin(values.role)) return;
    setValues((prev) => ({
      ...prev,
      siteIds: prev.siteIds.includes(siteId)
        ? prev.siteIds.filter((id) => id !== siteId)
        : [...prev.siteIds, siteId],
    }));
    if (fields.siteIds) setFields((prev) => ({ ...prev, siteIds: undefined }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const nextFields = validate(values, editing);
    setFields(nextFields);
    if (Object.keys(nextFields).length > 0) return;

    const role = ACCESS_ROLES.includes(values.role as AccessRole)
      ? values.role
      : isAdmin(values.role)
        ? "Admin"
        : values.role;

    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      role,
      gender: values.gender as Gender,
      designation: values.designation.trim(),
      company: values.company.trim(),
      siteIds: isAdmin(role) ? [] : values.siteIds,
      ...(values.password ? { password: values.password } : {}),
    };

    setSubmitting(true);
    try {
      if (entity === "user") {
        const result = member
          ? await updateUserRequest(member.id, payload)
          : await createUserRequest({
              ...payload,
              password: values.password,
            });
        onSaved(result.user);
      } else {
        const result = member
          ? await updateTeamMemberRequest(member.id, payload)
          : await createTeamMemberRequest({
              ...payload,
              password: values.password,
            });
        onSaved(result.member);
      }
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
      title={editing ? copy.editTitle : copy.createTitle}
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
            form="team-drawer-form"
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
              copy.submitCreate
            )}
          </button>
        </div>
      }
    >
      <form id="team-drawer-form" onSubmit={onSubmit} noValidate>
        {formError && !fields.name ? (
          <p
            role="alert"
            className="mb-4 rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {formError}
          </p>
        ) : null}

        <div className="space-y-4">
          <FormField id="team-name" label="Name" required error={fields.name}>
            <input
              id="team-name"
              name="name"
              placeholder="N S Suresh"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              className={formControlClass(fields.name)}
            />
          </FormField>

          <FormField id="team-email" label="Email" required error={fields.email}>
            <input
              id="team-email"
              name="email"
              type="email"
              autoComplete="off"
              placeholder="ns.suresh@serenticaglobal.com"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              className={formControlClass(fields.email)}
            />
          </FormField>

          <FormField
            id="team-password"
            label="Password"
            required={!editing}
            error={fields.password}
          >
            <input
              id="team-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => update("password", event.target.value)}
              className={formControlClass(fields.password)}
            />
          </FormField>

          <FormField id="team-role" label="Role" required error={fields.role}>
            <select
              id="team-role"
              name="role"
              value={values.role}
              onChange={(event) => update("role", event.target.value)}
              className={formControlClass(fields.role)}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            id="team-gender"
            label="Gender"
            required
            error={fields.gender}
          >
            <select
              id="team-gender"
              name="gender"
              value={values.gender}
              onChange={(event) =>
                update("gender", event.target.value as Gender | "")
              }
              className={formControlClass(fields.gender)}
            >
              <option value="">Select gender</option>
              {GENDERS.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            id="team-sites"
            label="Assign Sites"
            required
            error={fields.siteIds}
          >
            <SiteAssignDropdown
              sites={sites}
              selectedIds={values.siteIds}
              disabled={isAdmin(values.role)}
              error={fields.siteIds}
              active={open}
              onToggle={toggleSite}
            />
          </FormField>

          <FormField
            id="team-designation"
            label="Designation"
            required
            error={fields.designation}
          >
            <input
              id="team-designation"
              name="designation"
              placeholder="Asset Manager"
              value={values.designation}
              onChange={(event) => update("designation", event.target.value)}
              className={formControlClass(fields.designation)}
            />
          </FormField>

          <FormField
            id="team-company"
            label="Organization"
            error={fields.company}
          >
            <input
              id="team-company"
              name="company"
              placeholder="Serentica"
              value={values.company}
              onChange={(event) => update("company", event.target.value)}
              className={formControlClass(fields.company)}
            />
          </FormField>
        </div>
      </form>
    </Drawer>
  );
}
