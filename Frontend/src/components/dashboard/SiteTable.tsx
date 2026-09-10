import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Info } from "lucide-react";

import type { Site, SiteStatus } from "@/lib/api";
import { siteStatusLabel, siteStatusLozenge, siteTypeLabel } from "@/lib/labels";
import { canDeleteSite, canEditSite } from "@/lib/roles";

type SiteTableProps = {
  sites: Site[];
  role: string;
  onView: (site: Site) => void;
  onEdit: (site: Site) => void;
  onDelete: (site: Site) => void;
  manageActions?: boolean;
};

const actionClass =
  "inline-flex h-7 items-center rounded-md px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45";

export function SiteTable({
  sites,
  role,
  onView,
  onEdit,
  onDelete,
  manageActions = true,
}: SiteTableProps) {
  const canEdit = manageActions && canEditSite(role);
  const canDelete = manageActions && canDeleteSite(role);

  if (sites.length === 0) {
    return (
      <div className="rounded-md border border-edge bg-surface px-4 py-12 text-center text-sm text-muted">
        No sites yet. Create a site to start adding projects.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-edge bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[14%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[10%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-edge bg-fill text-xs font-medium text-muted">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Site ID</th>
              <th className="px-4 py-2.5 font-medium">Organization</th>
              <th className="px-4 py-2.5 font-medium">Address</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => (
              <tr
                key={site.id}
                className="border-b border-edge last:border-b-0 hover:bg-fill"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-fg">
                    {site.name}{" "}
                    <span className="font-normal text-muted">
                      ({siteTypeLabel[site.type]})
                    </span>
                  </p>
                </td>
                <td className="px-4 py-3">
                  <SiteIdCell id={site.id} />
                </td>
                <td className="px-4 py-3">
                  <span className="block truncate text-muted" title={site.organizationName || undefined}>
                    {site.organizationName || "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <AddressCell address={site.address} />
                </td>
                <td className="px-4 py-3">
                  <StatusLozenge status={site.status} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onView(site)}
                      className={`${actionClass} bg-[#2a6b45] text-white hover:bg-[#245c3b]`}
                    >
                      View
                    </button>
                    {manageActions ? (
                      <>
                        <button
                          type="button"
                          disabled={!canEdit}
                          title={
                            canEdit
                              ? "Edit site"
                              : "You do not have permission to edit sites."
                          }
                          onClick={() => onEdit(site)}
                          className={`${actionClass} border border-edge-strong text-secondary hover:bg-fill hover:text-fg`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={!canDelete}
                          title={
                            canDelete
                              ? "Delete site"
                              : "You do not have permission to delete sites."
                          }
                          onClick={() => onDelete(site)}
                          className={`${actionClass} border border-edge-strong text-danger hover:bg-danger/10`}
                        >
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusLozenge({ status }: { status: SiteStatus }) {
  return (
    <span
      className={`inline-flex h-5 items-center rounded px-1.5 text-xs font-medium ${siteStatusLozenge[status]}`}
    >
      {siteStatusLabel[status]}
    </span>
  );
}

function SiteIdCell({ id }: { id: string }) {
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

  const shortId = id.length > 8 ? `${id.slice(0, 8)}…` : id;

  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xs text-muted" title={id}>
        {shortId}
      </span>
      <button
        type="button"
        onClick={() => void copyId()}
        className="inline-flex h-6 w-6 items-center justify-center rounded text-subtle transition-colors hover:bg-fill hover:text-fg"
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

function AddressCell({ address }: { address: string }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (ref.current?.contains(target) || popoverRef.current?.contains(target)) {
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

  if (!address) {
    return <span className="text-muted">—</span>;
  }

  function toggle() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setCoords({
        top: rect.bottom + 6,
        left: Math.max(12, rect.right - 288),
      });
    }
    setOpen((current) => !current);
  }

  return (
    <div ref={ref} className="flex min-w-0 items-center gap-1">
      <span className="truncate text-muted" title={address}>
        {address}
      </span>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-subtle transition-colors hover:bg-fill hover:text-fg"
        aria-label="View full address"
        title="Address info"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={1.6} />
      </button>
      {open
        ? createPortal(
            <div
              ref={popoverRef}
              className="fixed z-[60] w-72 rounded-md border border-edge bg-surface p-3 text-xs leading-relaxed text-fg shadow-[var(--alcaster-shadow)]"
              style={{ top: coords.top, left: coords.left }}
            >
              {address}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
