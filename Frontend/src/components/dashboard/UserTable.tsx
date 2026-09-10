import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

import type { TeamMember } from "@/lib/api";
import { canManageUsers, isAdmin } from "@/lib/roles";

type UserTableProps = {
  users: TeamMember[];
  role: string;
  totalSiteCount: number;
  currentUserId?: string;
  onView: (user: TeamMember) => void;
  onEdit: (user: TeamMember) => void;
  onDelete: (user: TeamMember) => void;
};

const actionClass =
  "inline-flex h-7 items-center rounded-md px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45";

export function UserTable({
  users,
  role,
  totalSiteCount,
  currentUserId,
  onView,
  onEdit,
  onDelete,
}: UserTableProps) {
  const canManage = canManageUsers(role);

  if (users.length === 0) {
    return (
      <div className="rounded-md border border-edge bg-surface px-4 py-12 text-center text-sm text-muted">
        No users yet. Create a user to give someone access.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-edge bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[16%]" />
            <col className="w-[22%]" />
            <col className="w-[11%]" />
            <col className="w-[15%]" />
            <col className="w-[16%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-edge bg-fill text-xs font-medium text-muted">
              <th className="px-4 py-2.5 font-medium">Username</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Password</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Sites assigned</th>
              <th className="px-3 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((account) => {
              const isSelf = account.id === currentUserId;
              return (
                <tr
                  key={account.id}
                  className="border-b border-edge last:border-b-0 hover:bg-fill"
                >
                  <td className="px-4 py-3">
                    <p className="max-w-[200px] font-medium text-fg">
                      {account.name}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="block max-w-[240px] truncate text-muted"
                      title={account.email}
                    >
                      {account.email}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="font-mono tracking-[0.18em] text-muted"
                      title="Password is hidden"
                    >
                      ••••••••
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex h-5 items-center rounded px-1.5 text-xs font-medium bg-[var(--lozenge-pending-bg)] text-[var(--lozenge-pending-fg)]">
                      {account.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <SitesCell user={account} totalSiteCount={totalSiteCount} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onView(account)}
                        className={`${actionClass} bg-[#2a6b45] text-white hover:bg-[#245c3b]`}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        disabled={!canManage}
                        title={
                          canManage
                            ? "Edit user"
                            : "You do not have permission to edit users."
                        }
                        onClick={() => onEdit(account)}
                        className={`${actionClass} border border-edge-strong text-secondary hover:bg-fill hover:text-fg`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={!canManage || isSelf}
                        title={
                          isSelf
                            ? "You cannot delete your own account from here."
                            : canManage
                              ? "Delete user"
                              : "You do not have permission to delete users."
                        }
                        onClick={() => onDelete(account)}
                        className={`${actionClass} border border-edge-strong text-danger hover:bg-danger/10`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function assignedAllSites(user: TeamMember, totalSiteCount: number) {
  if (isAdmin(user.role)) return true;
  return totalSiteCount > 0 && user.sites.length >= totalSiteCount;
}

function SitesCell({
  user,
  totalSiteCount,
}: {
  user: TeamMember;
  totalSiteCount: number;
}) {
  const names = user.sites.map((site) => site.name);
  const allAssigned = assignedAllSites(user, totalSiteCount);

  if (!allAssigned && names.length === 0) {
    return <span className="text-muted">—</span>;
  }

  const label = allAssigned ? "All sites" : names[0];

  return (
    <div className="flex min-w-0 items-center gap-0.5">
      <span className="min-w-0 truncate text-muted" title={label}>
        {label}
      </span>
      {names.length > 0 ? <SitesInfoButton names={names} /> : null}
    </div>
  );
}

function SitesInfoButton({ names }: { names: string[] }) {
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
    <div ref={ref} className="shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        className="inline-flex h-6 w-6 items-center justify-center rounded text-subtle transition-colors hover:bg-fill hover:text-fg"
        aria-label="View assigned sites"
        title="Assigned sites"
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
              <p className="mb-1.5 font-medium text-fg">Assigned sites</p>
              <ul className="space-y-1 text-muted">
                {names.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
