export function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#010609]">
      <div className="flex flex-col items-center gap-3">
        <img
          src="/Alcaster-dark.svg"
          alt="Alcaster"
          width={72}
          height={32}
          className="h-8 w-auto"
        />
        <p className="text-[13px] font-semibold tracking-[0.18em] text-white">
          ALCASTER
        </p>
        <p className="text-xs text-white/35">Loading…</p>
      </div>
    </div>
  );
}
