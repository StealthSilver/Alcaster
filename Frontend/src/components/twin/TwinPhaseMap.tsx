import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Box, Info, Loader2 } from "lucide-react";

import {
  TWIN_PHASES,
  overallFillPercent,
  phaseFillPercent,
  type MissingRequiredField,
  type TwinFormKey,
  type TwinFormValues,
  type TwinPhaseId,
} from "@/lib/twinForm";

export type TwinBuildActionsProps = {
  existing?: boolean;
  submitting?: boolean;
  missing: MissingRequiredField[];
  onBuild: () => void;
  onJumpToField: (phaseId: TwinPhaseId, key: TwinFormKey) => void;
};

export function TwinBuildActions({
  existing = false,
  submitting = false,
  missing,
  onBuild,
  onJumpToField,
}: TwinBuildActionsProps) {
  const canBuild = missing.length === 0 && !submitting;

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {missing.length > 0 ? (
        <MissingFieldsInfo missing={missing} onJumpToField={onJumpToField} />
      ) : null}
      <button
        type="button"
        disabled={!canBuild}
        onClick={onBuild}
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg disabled:cursor-not-allowed disabled:opacity-45"
        title={
          canBuild
            ? existing
              ? "Rebuild the digital twin"
              : "Build the digital twin"
            : "Fill required fields to enable"
        }
      >
        {submitting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Building…
          </>
        ) : (
          <>
            <Box className="h-3.5 w-3.5" />
            {existing ? "Rebuild twin" : "Build Model"}
          </>
        )}
      </button>
    </div>
  );
}

type TwinPhaseMapProps = {
  values: TwinFormValues;
  current: TwinPhaseId;
  unlocked: TwinPhaseId[];
  onSelect: (id: TwinPhaseId) => void;
};

export function TwinPhaseMap({
  values,
  current,
  unlocked,
  onSelect,
}: TwinPhaseMapProps) {
  const overall = overallFillPercent(values);

  return (
    <div className="shrink-0 rounded-md border border-edge bg-surface px-3 py-2">
      <div className="mb-1.5 flex items-center gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
          Twin intake
        </p>
        <p className="text-xs tabular-nums text-muted">{overall}%</p>
        <div className="h-1 w-16 overflow-hidden rounded-full bg-fill">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${overall}%` }}
          />
        </div>
      </div>

      <ol className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
        {TWIN_PHASES.map((phase) => {
          const percent = phaseFillPercent(phase, values);
          const isCurrent = phase.id === current;
          const isUnlocked = unlocked.includes(phase.id);
          return (
            <li key={phase.id}>
              <button
                type="button"
                disabled={!isUnlocked}
                onClick={() => onSelect(phase.id)}
                className={`flex h-9 w-full items-center justify-between gap-2 rounded-md border px-2.5 text-left outline-none transition-colors ${
                  isCurrent
                    ? "border-accent/50 bg-accent/10"
                    : isUnlocked
                      ? "border-edge hover:bg-fill"
                      : "cursor-not-allowed border-edge opacity-45"
                }`}
              >
                <span
                  className={`truncate text-xs font-medium ${
                    isCurrent ? "text-fg" : "text-secondary"
                  }`}
                >
                  {phase.label}
                </span>
                <span
                  className={`shrink-0 text-xs font-semibold tabular-nums ${
                    percent === 100
                      ? "text-[color:var(--alcaster-success)]"
                      : isCurrent
                        ? "text-fg"
                        : "text-muted"
                  }`}
                >
                  {percent}%
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function MissingFieldsInfo({
  missing,
  onJumpToField,
}: {
  missing: MissingRequiredField[];
  onJumpToField: (phaseId: TwinPhaseId, key: TwinFormKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const grouped = useMemo(() => {
    const groups: {
      phaseId: TwinPhaseId;
      phaseLabel: string;
      fields: MissingRequiredField[];
    }[] = [];
    for (const field of missing) {
      const last = groups[groups.length - 1];
      if (last && last.phaseId === field.phaseId) {
        last.fields.push(field);
      } else {
        groups.push({
          phaseId: field.phaseId,
          phaseLabel: field.phaseLabel,
          fields: [field],
        });
      }
    }
    return groups;
  }, [missing]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const width = 288;
      setCoords({
        top: rect.bottom + 8,
        left: Math.min(
          Math.max(12, rect.right - width),
          window.innerWidth - width - 12,
        ),
      });
    }
    setOpen((current) => !current);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-edge-strong text-muted transition-colors hover:bg-fill hover:text-fg"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Required fields to build"
        title="Required fields"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={1.8} />
      </button>
      {open
        ? createPortal(
            <div
              ref={popoverRef}
              role="dialog"
              aria-label="Required fields"
              className="fixed z-[90] w-72 overflow-hidden rounded-md border border-edge bg-surface shadow-[var(--alcaster-shadow)]"
              style={{ top: coords.top, left: coords.left }}
            >
              <div className="border-b border-edge px-3 py-2">
                <p className="text-sm font-medium text-fg">Required to build</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {missing.length} field{missing.length === 1 ? "" : "s"} still
                  needed. Select one to jump there.
                </p>
              </div>
              <ul className="max-h-72 overflow-y-auto py-1.5">
                {grouped.map((group) => (
                  <li key={group.phaseId} className="px-1.5 py-1">
                    <p className="px-1.5 pb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                      {group.phaseLabel}
                    </p>
                    <ul>
                      {group.fields.map((field) => (
                        <li key={field.key}>
                          <button
                            type="button"
                            onClick={() => {
                              onJumpToField(field.phaseId, field.key);
                              setOpen(false);
                            }}
                            className="flex w-full flex-col items-start rounded px-1.5 py-1.5 text-left transition-colors hover:bg-fill"
                          >
                            <span className="text-sm text-fg">{field.label}</span>
                            <span className="text-[11px] text-muted">
                              {field.message}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
