import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Info } from "lucide-react";

import type { Site } from "@/lib/api";
import { siteStatusLabel, siteTypeLabel } from "@/lib/labels";

export function SiteContextLine({ site }: { site: Site }) {
  return (
    <div className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted">
      <p className="min-w-0 truncate">
        Site: {site.name}{" "}
        <span>({siteTypeLabel[site.type]})</span>
      </p>
      <SiteInfoButton site={site} />
    </div>
  );
}

function SiteInfoButton({ site }: { site: Site }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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
      const width = 320;
      const left = Math.min(
        Math.max(12, rect.left),
        window.innerWidth - width - 12,
      );
      setCoords({ top: rect.bottom + 8, left });
    }
    setOpen((current) => !current);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-subtle transition-colors hover:bg-fill hover:text-fg"
        aria-label="View site info"
        title="Site info"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={1.8} />
      </button>
      {open
        ? createPortal(
            <div
              ref={popoverRef}
              role="dialog"
              aria-label="Site info"
              className="fixed z-[90] w-80 overflow-hidden rounded-md border border-edge bg-surface shadow-[var(--alcaster-shadow)]"
              style={{ top: coords.top, left: coords.left }}
            >
              <div className="border-b border-edge px-3 py-2">
                <p className="text-sm font-medium text-fg">
                  {site.name}{" "}
                  <span className="font-normal text-muted">
                    ({siteTypeLabel[site.type]})
                  </span>
                </p>
              </div>
              <dl className="space-y-2 px-3 py-3 text-xs">
                <InfoRow label="Address" value={site.address || "—"} />
                <InfoRow
                  label="Coordinates"
                  value={`${site.latitude}, ${site.longitude}`}
                />
                <InfoRow label="Type" value={siteTypeLabel[site.type]} />
                <InfoRow label="Status" value={siteStatusLabel[site.status]} />
                <InfoRow
                  label="Organization"
                  value={site.organizationName || "—"}
                />
                <InfoRow
                  label="Projects"
                  value={String(site.projectCount)}
                />
                <div>
                  <dt className="text-muted">Site ID</dt>
                  <dd className="mt-0.5">
                    <CopyableId id={site.id} />
                  </dd>
                </div>
              </dl>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-fg">{value}</dd>
    </div>
  );
}

function CopyableId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <span className="min-w-0 break-all font-mono text-fg">{id}</span>
      <button
        type="button"
        onClick={() => void copyId()}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-subtle transition-colors hover:bg-fill hover:text-fg"
        aria-label={copied ? "Site ID copied" : "Copy site ID"}
        title={copied ? "Copied" : "Copy ID"}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-success" strokeWidth={2} />
        ) : (
          <Copy className="h-3.5 w-3.5" strokeWidth={1.8} />
        )}
      </button>
    </div>
  );
}
