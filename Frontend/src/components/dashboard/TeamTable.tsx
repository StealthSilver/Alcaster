import type { TeamMember } from "@/lib/api";
import { canAssignAdmin, canManageTeam, isAdmin } from "@/lib/roles";

type TeamTableProps = {
  members: TeamMember[];
  role: string;
  currentUserId?: string;
  onEdit: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
};

const actionClass =
  "inline-flex h-7 items-center rounded-md px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45";

export function TeamTable({
  members,
  role,
  currentUserId,
  onEdit,
  onDelete,
}: TeamTableProps) {
  const canManage = canManageTeam(role);
  const actorIsAdmin = canAssignAdmin(role);

  if (members.length === 0) {
    return (
      <div className="rounded-md border border-edge bg-surface px-4 py-12 text-center text-sm text-muted">
        No team members assigned to this site yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-edge bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b border-edge bg-fill text-xs font-medium text-muted">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Gender</th>
              <th className="px-4 py-2.5 font-medium">Designation</th>
              <th className="px-4 py-2.5 font-medium">Organization</th>
              <th className="px-3 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const targetIsAdmin = isAdmin(member.role);
              const isSelf = member.id === currentUserId;
              const canEditMember = canManage && (actorIsAdmin || !targetIsAdmin);
              const canDeleteMember =
                canEditMember && !isSelf;
              return (
                <tr
                  key={member.id}
                  className="border-b border-edge last:border-b-0 hover:bg-fill"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-fg">{member.name}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{member.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex h-5 items-center rounded px-1.5 text-xs font-medium bg-[var(--lozenge-pending-bg)] text-[var(--lozenge-pending-fg)]">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {member.gender || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {member.designation || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {member.company || "—"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex w-max items-center justify-end gap-1.5">
                      <button
                        type="button"
                        disabled={!canEditMember}
                        title={
                          canEditMember
                            ? "Edit team member"
                            : "You do not have permission to edit this member."
                        }
                        onClick={() => onEdit(member)}
                        className={`${actionClass} border border-edge-strong text-secondary hover:bg-fill hover:text-fg`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={!canDeleteMember}
                        title={
                          isSelf
                            ? "You cannot delete your own account from here."
                            : canDeleteMember
                              ? "Delete team member"
                              : "You do not have permission to delete this member."
                        }
                        onClick={() => onDelete(member)}
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
