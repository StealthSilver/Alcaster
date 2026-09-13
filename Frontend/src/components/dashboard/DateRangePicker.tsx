import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays } from "lucide-react";

import {
  formatDateInput,
  formatDisplayRange,
  parseDateInput,
  type DateRangeValue,
} from "@/lib/chartActions";
import { iconButtonClass } from "./panel";

type DateRangePickerProps = {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  /** Icon-only trigger — fits tight chart toolbars */
  compact?: boolean;
};

export function DateRangePicker({
  value,
  onChange,
  compact = false,
}: DateRangePickerProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(formatDateInput(value.start));
  const [draftEnd, setDraftEnd] = useState(formatDateInput(value.end));
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setDraftStart(formatDateInput(value.start));
    setDraftEnd(formatDateInput(value.end));
  }, [value.start, value.end]);

  function openPicker() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const width = 280;
      const left = Math.min(
        Math.max(12, rect.right - width),
        window.innerWidth - width - 12,
      );
      setCoords({ top: rect.bottom + 6, left });
    }
    setOpen(true);
  }

  function apply() {
    const start = parseDateInput(draftStart);
    const end = parseDateInput(draftEnd);
    if (!start || !end) {
      setError("Enter valid dates.");
      return;
    }
    if (start > end) {
      setError("Start must be on or before end.");
      return;
    }
    setError(null);
    onChange({ start, end, preset: "custom" });
    setOpen(false);
  }

  const label = formatDisplayRange(value.start, value.end);

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className={
          compact
            ? iconButtonClass
            : [
                "inline-flex h-8 max-w-[148px] items-center gap-1.5 truncate rounded-md border border-edge px-2 text-[11px] tabular-nums transition-colors hover:bg-fill hover:text-fg",
                open ? "border-accent/50 text-fg" : "text-muted",
              ].join(" ")
        }
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        title={label}
        aria-label={`Date range ${label}`}
      >
        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
        {compact ? null : (
          <span className="truncate">{label}</span>
        )}
      </button>

      {open
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-[80] cursor-default"
                aria-label="Close date picker"
                onClick={() => setOpen(false)}
              />
              <div
                id={`${id}-panel`}
                className="fixed z-[90] w-[280px] rounded-md border border-edge bg-surface p-3 shadow-lg"
                style={{ top: coords.top, left: coords.left }}
              >
                <p className="text-[11px] font-medium text-secondary">
                  Date range
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="block text-[10px] text-muted">
                    Start
                    <input
                      type="date"
                      value={draftStart}
                      max={draftEnd}
                      onChange={(e) => {
                        setDraftStart(e.target.value);
                        setError(null);
                      }}
                      className="mt-1 h-8 w-full min-w-0 rounded-md border border-edge-strong bg-input px-1.5 text-xs text-fg outline-none focus:border-accent/50"
                    />
                  </label>
                  <label className="block text-[10px] text-muted">
                    End
                    <input
                      type="date"
                      value={draftEnd}
                      min={draftStart}
                      onChange={(e) => {
                        setDraftEnd(e.target.value);
                        setError(null);
                      }}
                      className="mt-1 h-8 w-full min-w-0 rounded-md border border-edge-strong bg-input px-1.5 text-xs text-fg outline-none focus:border-accent/50"
                    />
                  </label>
                </div>
                {error ? (
                  <p className="mt-2 text-[10px] text-danger">{error}</p>
                ) : null}
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="h-7 rounded-md px-2.5 text-[11px] text-muted hover:text-fg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={apply}
                    className="h-7 rounded-md bg-accent px-2.5 text-[11px] font-medium text-on-accent"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
