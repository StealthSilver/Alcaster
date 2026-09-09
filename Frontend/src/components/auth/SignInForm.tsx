import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { AFTER_AUTH_PATH } from "@/lib/paths";
import { validateSignIn } from "@/lib/validation";

import { Field } from "./Field";
import { inputClass } from "./inputClass";

export function SignInForm() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fields, setFields] = useState<Partial<{ email: string; password: string }>>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextFields = validateSignIn({ email, password });
    setFields(nextFields);
    if (Object.keys(nextFields).length > 0) return;

    setSubmitting(true);
    try {
      await signIn(email, password);
      void navigate(AFTER_AUTH_PATH, { replace: true });
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
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && !fields.email && !fields.password ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {formError}
        </p>
      ) : null}

      <Field id="signin-email" label="Email" error={fields.email}>
        <input
          id="signin-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (fields.email) setFields((prev) => ({ ...prev, email: undefined }));
          }}
          aria-invalid={Boolean(fields.email)}
          aria-describedby={fields.email ? "signin-email-error" : undefined}
          className={inputClass(fields.email)}
        />
      </Field>

      <Field id="signin-password" label="Password" error={fields.password}>
        <div className="relative">
          <input
            id="signin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (fields.password) {
                setFields((prev) => ({ ...prev, password: undefined }));
              }
            }}
            aria-invalid={Boolean(fields.password)}
            aria-describedby={
              fields.password ? "signin-password-error" : undefined
            }
            className={inputClass(fields.password, "pr-11")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted transition-colors hover:text-secondary"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" strokeWidth={1.6} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={1.6} />
            )}
          </button>
        </div>
      </Field>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
