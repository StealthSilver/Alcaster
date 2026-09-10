import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import {
  ACCESS_ROLES,
  validateRequestAccess,
  type AccessRole,
  type RequestAccessValues,
} from "@/lib/validation";

import { authButtonClass } from "./authButtonClass";
import { Field } from "./Field";
import { inputClass } from "./inputClass";

const emptyValues: RequestAccessValues = {
  fullName: "",
  email: "",
  company: "",
  role: "Site Manager",
  message: "",
};

export function RequestAccessForm() {
  const { requestAccess } = useAuth();
  const [values, setValues] = useState<RequestAccessValues>(emptyValues);
  const [fields, setFields] = useState<
    Partial<Record<keyof RequestAccessValues, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof RequestAccessValues>(
    key: K,
    value: RequestAccessValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (fields[key]) setFields((prev) => ({ ...prev, [key]: undefined }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextFields = validateRequestAccess(values);
    setFields(nextFields);
    if (Object.keys(nextFields).length > 0) return;

    setSubmitting(true);
    try {
      const message = await requestAccess(values);
      setSuccess(message);
      setValues(emptyValues);
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

  if (success) {
    return (
      <div className="rounded-xl border border-edge bg-fill px-4 py-6 text-center">
        <CheckCircle2
          className="mx-auto h-8 w-8 text-success"
          strokeWidth={1.6}
        />
        <h2 className="mt-3 text-base font-semibold text-fg">
          Request received
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{success}</p>
        <Link
          to="/signin"
          className={`mt-5 ${authButtonClass} w-auto px-5`}
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-2">
      {formError ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/25 bg-danger/10 px-3 py-1.5 text-sm text-danger"
        >
          {formError}
        </p>
      ) : null}

      <Field id="access-full-name" label="Full Name" error={fields.fullName} tight>
        <input
          id="access-full-name"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="John Doe"
          value={values.fullName}
          onChange={(event) => update("fullName", event.target.value)}
          aria-invalid={Boolean(fields.fullName)}
          aria-describedby={
            fields.fullName ? "access-full-name-error" : undefined
          }
          className={inputClass(fields.fullName, "h-9")}
        />
      </Field>

      <Field id="access-email" label="Email" error={fields.email} tight>
        <input
          id="access-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          aria-invalid={Boolean(fields.email)}
          aria-describedby={fields.email ? "access-email-error" : undefined}
          className={inputClass(fields.email, "h-9")}
        />
      </Field>

      <Field id="access-company" label="Company" error={fields.company} tight>
        <input
          id="access-company"
          name="company"
          type="text"
          autoComplete="organization"
          placeholder="Your Company Name"
          value={values.company}
          onChange={(event) => update("company", event.target.value)}
          aria-invalid={Boolean(fields.company)}
          aria-describedby={fields.company ? "access-company-error" : undefined}
          className={inputClass(fields.company, "h-9")}
        />
      </Field>

      <Field id="access-role" label="Role" error={fields.role} tight>
        <select
          id="access-role"
          name="role"
          value={values.role}
          onChange={(event) => update("role", event.target.value as AccessRole)}
          aria-invalid={Boolean(fields.role)}
          aria-describedby={fields.role ? "access-role-error" : undefined}
          className={inputClass(fields.role, "h-9")}
        >
          {ACCESS_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </Field>

      <Field id="access-message" label="Message" error={fields.message} tight>
        <textarea
          id="access-message"
          name="message"
          rows={2}
          placeholder="Tell us why you need access..."
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          aria-invalid={Boolean(fields.message)}
          aria-describedby={
            fields.message ? "access-message-error" : undefined
          }
          className={inputClass(fields.message, "h-auto min-h-[52px] resize-none py-1.5")}
        />
      </Field>

      <button
        type="submit"
        disabled={submitting}
        className={authButtonClass}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending request…
          </>
        ) : (
          "Request Access"
        )}
      </button>
    </form>
  );
}
