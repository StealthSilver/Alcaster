import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

import {
  AddTeamMemberButton,
  DashboardShell,
  TeamTable,
} from "@/components/dashboard";
import { TeamDrawer } from "@/components/dashboard/TeamDrawer";
import { panelClass } from "@/components/dashboard/panel";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  ApiError,
  deleteTeamMemberRequest,
  listTeamMembersRequest,
  type TeamMember,
} from "@/lib/api";
import { canManageTeam } from "@/lib/roles";

export function TeamPage() {
  const { user } = useAuth();
  const { selectedSite, sites, loading: workspaceLoading } = useWorkspace();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<"create" | TeamMember | null>(null);
  const [deleting, setDeleting] = useState<TeamMember | null>(null);

  const role = user?.role ?? "";
  const canCreate = canManageTeam(role) && Boolean(selectedSite);

  const shellUser = user
    ? { name: user.name, role: user.role, initials: user.initials }
    : { name: "User", role: "Organization Manager", initials: "U" };

  useEffect(() => {
    if (workspaceLoading) return;
    if (!selectedSite) {
      setMembers([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    listTeamMembersRequest(selectedSite.id)
      .then(({ members: nextMembers }) => {
        if (cancelled) return;
        setMembers(nextMembers);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Unable to load the team.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSite, workspaceLoading]);

  async function refresh() {
    if (!selectedSite) return;
    const { members: nextMembers } = await listTeamMembersRequest(
      selectedSite.id,
    );
    setMembers(nextMembers);
  }

  return (
    <DashboardShell
      user={shellUser}
      title="Team Dashboard"
      actions={
        <AddTeamMemberButton
          disabled={!canCreate}
          onClick={() => setDrawer("create")}
        />
      }
    >
      {workspaceLoading || loading ? (
        <p className="text-sm text-muted">Loading team…</p>
      ) : error ? (
        <p className="rounded-md border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : !selectedSite ? (
        <div className="rounded-md border border-edge bg-surface px-4 py-12 text-center text-sm text-muted">
          Select a site from the switcher to view its team.
        </div>
      ) : (
        <TeamTable
          members={members}
          role={role}
          currentUserId={user?.id}
          onEdit={(member) => setDrawer(member)}
          onDelete={(member) => setDeleting(member)}
        />
      )}

      <TeamDrawer
        open={drawer !== null}
        member={drawer && drawer !== "create" ? drawer : null}
        sites={sites}
        currentSiteId={selectedSite?.id ?? null}
        onClose={() => setDrawer(null)}
        onSaved={async () => {
          await refresh();
          setDrawer(null);
        }}
      />

      {deleting ? (
        <DeleteTeamMemberDialog
          member={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={async () => {
            await refresh();
            setDeleting(null);
          }}
        />
      ) : null}
    </DashboardShell>
  );
}

function DeleteTeamMemberDialog({
  member,
  onClose,
  onDeleted,
}: {
  member: TeamMember;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function confirmDelete() {
    setError(null);
    setSubmitting(true);
    try {
      await deleteTeamMemberRequest(member.id);
      await onDeleted();
    } catch (caught: unknown) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-overlay"
        aria-label="Close delete team member dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-team-title"
        className={`relative w-full max-w-md ${panelClass}`}
      >
        <div className="px-4 py-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-fill hover:text-fg"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 id="delete-team-title" className="pr-8 text-sm font-semibold text-fg">
            Delete {member.name}?
          </h2>
        </div>
        {error ? (
          <p
            role="alert"
            className="mx-4 mb-3 rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 border-t border-edge px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-8 items-center rounded-md px-3 text-sm text-muted transition-colors hover:bg-fill hover:text-fg disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void confirmDelete()}
            disabled={submitting}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-danger-strong px-3 text-sm font-medium text-on-accent transition-colors hover:bg-danger disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deleting
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
