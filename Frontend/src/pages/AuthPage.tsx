import { Link, NavLink } from "react-router-dom";

import { RequestAccessForm } from "@/components/auth/RequestAccessForm";
import { SignInForm } from "@/components/auth/SignInForm";

type AuthPageProps = {
  mode: "signin" | "request";
};

const tabClass = ({ isActive }: { isActive: boolean }) =>
  [
    "relative flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors",
    isActive
      ? "bg-[#e6740a]/12 text-white"
      : "text-white/45 hover:bg-white/[0.03] hover:text-white/75",
  ].join(" ");

export function AuthPage({ mode }: AuthPageProps) {
  const isSignIn = mode === "signin";

  return (
    <div className="relative flex min-h-screen bg-[#010609] font-sans text-white antialiased">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 20% 20%, rgba(230,116,10,0.12), transparent 70%)",
        }}
        aria-hidden
      />

      <aside className="relative hidden w-[44%] flex-col justify-between border-r border-white/[0.06] px-10 py-10 lg:flex xl:px-14">
        <Link to="/signin" className="flex items-center gap-2.5">
          <img
            src="/Alcaster-dark.svg"
            alt="Alcaster"
            width={72}
            height={32}
            className="h-7 w-auto"
          />
          <span className="text-[13px] font-semibold tracking-[0.18em] text-white">
            ALCASTER
          </span>
        </Link>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#e6740a]">
            Digital twin platform
          </p>
          <h1 className="mt-4 max-w-md text-3xl font-semibold tracking-tight text-white xl:text-4xl">
            Monitor and understand your renewable energy portfolio.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/40">
            Sign in to operate plants, inspect digital twins, and act on live
            generation data from one workspace.
          </p>
        </div>

        <p className="text-xs text-white/25">
          Access is provisioned for operators and partners.
        </p>
      </aside>

      <main className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[420px]">
          <Link
            to="/signin"
            className="mb-8 flex items-center gap-2.5 lg:hidden"
          >
            <img
              src="/Alcaster-dark.svg"
              alt="Alcaster"
              width={72}
              height={32}
              className="h-7 w-auto"
            />
            <span className="text-[13px] font-semibold tracking-[0.18em] text-white">
              ALCASTER
            </span>
          </Link>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.25)] sm:p-7">
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/[0.06] bg-black/20 p-1">
              <NavLink to="/signin" className={tabClass}>
                Sign In
              </NavLink>
              <NavLink to="/request-access" className={tabClass}>
                Request Access
              </NavLink>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold tracking-tight text-white">
                {isSignIn ? "Sign In" : "Request Access"}
              </h2>
              <p className="mt-1.5 text-sm text-white/40">
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
      </main>
    </div>
  );
}
