import { AlcasterLogo } from "@/components/theme/AlcasterLogo";

export function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page">
      <div className="flex flex-col items-center gap-3">
        <AlcasterLogo className="h-8 w-auto" />
        <p className="text-[13px] font-semibold tracking-[0.18em] text-fg">
          ALCASTER
        </p>
        <p className="text-xs text-muted">Loading…</p>
      </div>
    </div>
  );
}
