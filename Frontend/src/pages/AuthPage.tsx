import { Link, NavLink } from "react-router-dom";

import { AsciiWindscape } from "@/components/auth/AsciiWindscape";
import { RequestAccessForm } from "@/components/auth/RequestAccessForm";
import { SignInForm } from "@/components/auth/SignInForm";
import { AlcasterLogo } from "@/components/theme/AlcasterLogo";
import { ThemeIconButton } from "@/components/theme/ThemeToggle";

type AuthPageProps = {
  mode: "signin" | "request";
};

const tabClass = ({ isActive }: { isActive: boolean }) =>
  [
    "relative flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors",
    isActive
      ? "bg-accent/12 text-fg"
      : "text-muted hover:bg-fill hover:text-secondary",
  ].join(" ");

export function AuthPage({ mode }: AuthPageProps) {
  const isSignIn = mode === "signin";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#010609] px-4 py-10 font-sans text-fg antialiased">
      <AsciiWindscape />

      <div className="absolute right-4 top-4 z-10 rounded-md bg-black/35">
        <ThemeIconButton />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        <Link
          to="/signin"
          className="mb-8 flex items-center justify-center gap-2.5 drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)]"
        >
          <AlcasterLogo
            onDark
            className="h-10 w-auto"
            width={91}
            height={41}
          />
          <span className="text-sm font-semibold tracking-[0.18em] text-white">
            ALCASTER
          </span>
        </Link>

        <div className="rounded-md border border-edge bg-surface/90 p-6 shadow-[var(--alcaster-shadow)] backdrop-blur-[2px] sm:p-7">
          <div className="grid grid-cols-2 gap-1 rounded-md border border-edge bg-fill p-1">
            <NavLink to="/signin" className={tabClass}>
              Sign In
            </NavLink>
            <NavLink to="/request-access" className={tabClass}>
              Request Access
            </NavLink>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold tracking-tight text-fg">
              {isSignIn ? "Sign In" : "Request Access"}
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              {isSignIn
                ? "Enter your email and password to continue."
                : "Fill out the form and we'll get back to you"}
            </p>
          </div>

          <div className="mt-6">
            {isSignIn ? <SignInForm /> : <RequestAccessForm />}
          </div>
        </div>
      </div>
    </div>
  );
}
