import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import {
  CreateUserButton,
  DashboardShell,
  UserTable,
} from "@/components/dashboard";
import { Drawer } from "@/components/dashboard/Drawer";
import { TeamDrawer } from "@/components/dashboard/TeamDrawer";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  ApiError,
  deleteUserRequest,
  listUsersRequest,
  type TeamMember,
} from "@/lib/api";
import { canManageUsers } from "@/lib/roles";

export function UsersPage() {
  const { user } = useAuth();
  const { sites, loading: workspaceLoading } = useWorkspace();
  const navigate = useNavigate();
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<"create" | TeamMember | null>(null);
  const [deleting, setDeleting] = useState<TeamMember | null>(null);

  const role = user?.role ?? "";
  const canCreate = canManageUsers(role);

  const shellUser = user
    ? { name: user.name, role: user.role, initials: user.initials }
    : { name: "User", role: "Organization Manager", initials: "U" };

  useEffect(() => {
    if (!canCreate) return;

    let cancelled = false;
    setLoading(true);
    listUsersRequest()
      .then(({ users: nextUsers }) => {
        if (cancelled) return;
        setUsers(nextUsers);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Unable to load users.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canCreate]);

  if (!canCreate) {
    return <Navigate to="/" replace />;
  }

  async function refresh() {
    const { users: nextUsers } = await listUsersRequest();
    setUsers(nextUsers);
  }

  return (
    <DashboardShell
      user={shellUser}
      title="Users"
      hideSiteMeta
      actions={
        <CreateUserButton
          disabled={!canCreate}
          onClick={() => setDrawer("create")}
        />
      }
    >
      {workspaceLoading || loading ? (
        <p className="text-sm text-muted">Loading users…</p>
      ) : error ? (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : (
        <UserTable
          users={users}
          role={role}
          totalSiteCount={sites.length}
          currentUserId={user?.id}
          onView={(account) => {
            void navigate(`/profile/${account.id}`);
          }}
          onEdit={(account) => setDrawer(account)}
          onDelete={(account) => setDeleting(account)}
        />
      )}

      <TeamDrawer
        open={drawer !== null}
        entity="user"
        member={drawer && drawer !== "create" ? drawer : null}
        sites={sites}
        currentSiteId={null}
        onClose={() => setDrawer(null)}
        onSaved={async () => {
          await refresh();
          setDrawer(null);
        }}
      />

      <DeleteUserDrawer
        account={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={async () => {
          await refresh();
          setDeleting(null);
        }}
      />
    </DashboardShell>
  );
}

function DeleteUserDrawer({
  account,
  onClose,
  onDeleted,
}: {
  account: TeamMember | null;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!account) return;
    setError(null);
    setSubmitting(false);
  }, [account]);

  async function confirmDelete() {
    if (!account) return;
    setError(null);
    setSubmitting(true);
    try {
      await deleteUserRequest(account.id);
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
    <Drawer
      open={Boolean(account)}
      title="Delete user"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
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
            disabled={submitting || !account}
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
      }
    >
      {account ? (
        <div className="space-y-3">
          {error ? (
            <p
              role="alert"
              className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {error}
            </p>
          ) : null}
          <p className="text-sm text-fg">
            Delete{" "}
            <span className="font-medium">{account.name}</span>{" "}
            <span className="text-muted">({account.email})</span>?
          </p>
        </div>
      ) : null}
    </Drawer>
  );
}
