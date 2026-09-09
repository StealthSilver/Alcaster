import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, X } from "lucide-react";

import { DashboardShell } from "@/components/dashboard";
import { FormField } from "@/components/dashboard/FormField";
import {
  formControlClass,
  panelClass,
  sectionHintClass,
  sectionTitleClass,
} from "@/components/dashboard/panel";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { validateUpdateProfile } from "@/lib/validation";

type ProfileForm = {
  name: string;
  currentPassword: string;
  newPassword: string;
};

function formatJoined(iso: string | null | undefined) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProfilePage() {
  const { user, updateProfile, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<ProfileForm>({
    name: user?.name ?? "",
    currentPassword: "",
    newPassword: "",
  });
  const [fields, setFields] = useState<Partial<ProfileForm>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!editing && user) {
      setValues({
        name: user.name,
        currentPassword: "",
        newPassword: "",
      });
    }
  }, [editing, user]);

  const shellUser = user
    ? { name: user.name, role: user.role, initials: user.initials }
    : { name: "User", role: "Organization Manager", initials: "U" };

  if (!user) return null;

  function startEditing() {
    setSuccess(null);
    setFormError(null);
    setFields({});
    setValues({
      name: user?.name ?? "",
      currentPassword: "",
      newPassword: "",
    });
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setFormError(null);
    setFields({});
    setShowNewPassword(false);
    setShowCurrentPassword(false);
  }

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (fields[key]) setFields((prev) => ({ ...prev, [key]: undefined }));
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccess(null);
    const nextFields = validateUpdateProfile(values);
    setFields(nextFields);
    if (Object.keys(nextFields).length > 0) return;

    setSubmitting(true);
    try {
      await updateProfile({
        name: values.name.trim(),
        currentPassword: values.currentPassword || undefined,
        newPassword: values.newPassword.trim() || undefined,
      });
      setEditing(false);
      setShowNewPassword(false);
      setShowCurrentPassword(false);
      setSuccess(
        values.newPassword.trim()
          ? "Profile and password updated."
          : "Profile updated.",
      );
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
    <DashboardShell
      user={shellUser}
      title="Profile"
      actions={
        editing ? undefined : (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex h-8 shrink-0 items-center rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
          >
            Edit
          </button>
        )
      }
    >
      <div className="max-w-2xl">
        <p className="mb-5 text-sm text-muted">
          Manage your account details for this organisation.
        </p>

        <section className={panelClass}>
          <div className="flex items-center gap-3 border-b border-edge px-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-edge-strong bg-fill text-xs font-semibold uppercase text-fg">
              {user.initials}
            </div>
            <div className="min-w-0">
              <h2 className={sectionTitleClass}>{user.name}</h2>
              <p className={sectionHintClass}>
                {user.email}
                <span className="text-subtle"> · </span>
                {user.role}
              </p>
            </div>
          </div>

          {success ? (
            <p
              role="status"
              className="border-b border-edge px-4 py-2.5 text-sm text-success"
            >
              {success}
            </p>
          ) : null}

          {editing ? (
            <form onSubmit={onSave} noValidate>
              {formError ? (
                <p
                  role="alert"
                  className="mx-4 mt-4 rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger"
                >
                  {formError}
                </p>
              ) : null}

              <div className="space-y-4 p-4">
                <FormField
                  id="profile-name"
                  label="Full name"
                  hint="Shown in the dashboard and to your organisation."
                  error={fields.name}
                >
                  <input
                    id="profile-name"
                    name="name"
                    autoComplete="name"
                    value={values.name}
                    onChange={(event) => update("name", event.target.value)}
                    className={formControlClass(fields.name)}
                  />
                </FormField>
                <ReadOnlyField label="Email" value={user.email} />
                <ReadOnlyField label="Role" value={user.role} />
                <ReadOnlyField
                  label="Organisation"
                  value={user.organizationName ?? "—"}
                />
                <ReadOnlyField
                  label="Member since"
                  value={formatJoined(user.createdAt)}
                />
                <FormField
                  id="profile-new-password"
                  label="New password"
                  hint="Leave blank to keep your current password."
                  error={fields.newPassword}
                >
                  <div className="relative">
                    <input
                      id="profile-new-password"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="New password"
                      value={values.newPassword}
                      onChange={(event) =>
                        update("newPassword", event.target.value)
                      }
                      className={formControlClass(fields.newPassword, "pr-10")}
                    />
                    <PasswordToggle
                      show={showNewPassword}
                      onToggle={() => setShowNewPassword((value) => !value)}
                    />
                  </div>
                </FormField>
                <FormField
                  id="profile-current-password"
                  label="Current password"
                  hint="Required only if you change your password."
                  error={fields.currentPassword}
                >
                  <div className="relative">
                    <input
                      id="profile-current-password"
                      name="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Current password"
                      value={values.currentPassword}
                      onChange={(event) =>
                        update("currentPassword", event.target.value)
                      }
                      className={formControlClass(
                        fields.currentPassword,
                        "pr-10",
                      )}
                    />
                    <PasswordToggle
                      show={showCurrentPassword}
                      onToggle={() => setShowCurrentPassword((value) => !value)}
                    />
                  </div>
                </FormField>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-edge px-4 py-3">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={submitting}
                  className="inline-flex h-8 items-center rounded-md px-3 text-sm text-muted transition-colors hover:bg-fill hover:text-fg disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <dl className="divide-y divide-edge">
              <InfoRow label="Full name" value={user.name} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Role" value={user.role} />
              <InfoRow
                label="Organisation"
                value={user.organizationName ?? "—"}
              />
              <InfoRow label="Password" value="••••••••" />
              <InfoRow label="Member since" value={formatJoined(user.createdAt)} />
            </dl>
          )}
        </section>

        <section className={`${panelClass} mt-4`}>
          <div className="px-4 py-4">
            <h2 className={sectionTitleClass}>Delete account</h2>
            <p className={sectionHintClass}>
              Permanently remove your account. This cannot be undone.
            </p>
          </div>
          <div className="flex justify-end border-t border-edge px-4 py-3">
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex h-8 items-center rounded-md border border-edge-strong px-3 text-sm text-danger transition-colors hover:border-danger/40 hover:bg-danger/10"
            >
              Delete account
            </button>
          </div>
        </section>
      </div>

      {deleteOpen ? (
        <DeleteAccountDialog
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => {
            void navigate("/signin", { replace: true });
          }}
          deleteAccount={deleteAccount}
        />
      ) : null}
    </DashboardShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center sm:gap-6">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm text-fg">{value}</dd>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-fg">{label}</p>
      <p className="mt-1.5 text-sm text-secondary">{value}</p>
    </div>
  );
}

function PasswordToggle({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted transition-colors hover:text-secondary"
      aria-label={show ? "Hide password" : "Show password"}
    >
      {show ? (
        <EyeOff className="h-3.5 w-3.5" strokeWidth={1.6} />
      ) : (
        <Eye className="h-3.5 w-3.5" strokeWidth={1.6} />
      )}
    </button>
  );
}

function DeleteAccountDialog({
  onClose,
  onDeleted,
  deleteAccount,
}: {
  onClose: () => void;
  onDeleted: () => void;
  deleteAccount: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!password) {
      setError("Enter your password to confirm.");
      return;
    }

    setSubmitting(true);
    try {
      await deleteAccount(password);
      onDeleted();
    } catch (caught: unknown) {
      if (caught instanceof ApiError) {
        setError(caught.fields.password ?? caught.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-overlay"
        aria-label="Close delete account dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className={`relative w-full max-w-md ${panelClass}`}
      >
        <div className="px-4 py-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-fill hover:text-fg"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 id="delete-account-title" className="pr-8 text-sm font-semibold text-fg">
            Delete account
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            This permanently deletes your account. Enter your password to confirm.
          </p>
        </div>
        <form onSubmit={onSubmit} className="border-t border-edge" noValidate>
          <div className="space-y-4 p-4">
            {error ? (
              <p
                role="alert"
                className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {error}
              </p>
            ) : null}
            <FormField id="delete-password" label="Password">
              <div className="relative">
                <input
                  id="delete-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={formControlClass(error ?? undefined, "pr-10")}
                />
                <PasswordToggle
                  show={showPassword}
                  onToggle={() => setShowPassword((value) => !value)}
                />
              </div>
            </FormField>
          </div>
          <div className="flex justify-end gap-2 border-t border-edge px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-8 items-center rounded-md px-3 text-sm text-muted transition-colors hover:bg-fill hover:text-fg disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-danger-strong px-3 text-sm font-medium text-on-accent transition-colors hover:bg-danger disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deleting
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
