import { useRoles } from "../api/hooks/useRoles";
import { usePermissions } from "../api/hooks/usePermissions";
import { useUsers } from "../api/hooks/useUsers";
import { useAuditPaginated } from "../api/hooks/useAudit";
import { Badge } from "../components/ui/Badge";
import { QueryState } from "../components/ui/QueryState";
import { Skeleton } from "../components/ui/Skeleton";
import { usePendingRequests } from "../api/hooks/useRequests";
import { useAuthStore } from "../stores/authStore";
import { Link } from "react-router-dom";

function count(value: number, noun: string) {
  return { value, noun: value === 1 ? noun : `${noun}s` };
}

function Stat({ value, noun, to }: { value: number | string; noun: string; to: string }) {
  return (
    <Link
      to={to}
      className="rounded underline decoration-[var(--color-accent)] decoration-2 underline-offset-[0.14em] transition-colors hover:text-[var(--color-accent)]"
    >
      {value} {noun}
    </Link>
  );
}

function actionColor(action: string) {
  if (/delet|den|revok|remov|cancel/.test(action)) return "bg-[var(--color-error)]";
  if (/creat|approv|assign|grant/.test(action)) return "bg-[var(--color-success)]";
  return "bg-[var(--color-accent)]";
}

export function Dashboard() {
  const rolesQuery = useRoles();
  const permissionsQuery = usePermissions();
  const usersQuery = useUsers();
  const auditQuery = useAuditPaginated({ limit: 8 });
  const pendingQuery = usePendingRequests();
  const { user, currentOrgId } = useAuthStore();

  const roles = rolesQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const recentLogs = auditQuery.data?.logs ?? [];
  const orgName = user?.organizations.find((o) => o.id === currentOrgId)?.name ?? "Your organization";
  const pending = pendingQuery.data?.total;
  const headlineQueries = [usersQuery, rolesQuery, permissionsQuery];

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header className="max-w-4xl pt-2">
        <QueryState
          isLoading={headlineQueries.some((q) => q.isLoading)}
          isError={headlineQueries.some((q) => q.isError)}
          error={headlineQueries.find((q) => q.isError)?.error}
          onRetry={() => headlineQueries.forEach((q) => q.refetch())}
          loading={
            <div className="space-y-3">
              <Skeleton className="h-10 w-full md:h-12" />
              <Skeleton className="h-10 w-2/3 md:h-12" />
            </div>
          }
        >
          <h1 className="font-display text-3xl font-semibold leading-[1.15] tracking-tight md:text-5xl md:leading-[1.1]">
            {orgName} has <Stat {...count(users.length, "member")} to="/admin/users" />,{" "}
            <Stat {...count(roles.length, "role")} to="/admin/roles" /> and{" "}
            <Stat {...count(permissionsQuery.data?.length ?? 0, "permission")} to="/admin/permissions" />.
          </h1>
        </QueryState>
        {/* Members get 403 here; the sentence only appears for people who can act on it */}
        {pending !== undefined && (
          <p className="mt-4 text-lg text-[var(--color-text-secondary)]">
            {pending === 0 ? (
              "No access requests need a decision."
            ) : (
              <Link to="/admin/requests" className="font-medium text-[var(--color-accent)] hover:underline">
                {pending === 1 ? "1 access request needs" : `${pending} access requests need`} a decision.
              </Link>
            )}
          </p>
        )}
      </header>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold">Recent activity</h2>
            <Link to="/admin/audit" className="text-sm text-[var(--color-accent)] hover:underline">
              Open audit log
            </Link>
          </div>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              Changes to roles, policies and members will appear here.
            </p>
          ) : (
            <ol className="divide-y divide-[var(--color-border-muted)] border-y border-[var(--color-border-muted)]">
              {recentLogs.map((log) => (
                <li key={log.id} className="flex items-center gap-3 py-3">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${actionColor(log.action)}`} />
                  <div className="min-w-0 flex-1 truncate text-sm">
                    <span className="font-medium">{log.action.replace(/[._]/g, " ")}</span>
                    {log.actor_email && (
                      <span className="text-[var(--color-text-muted)]"> by {log.actor_email.split("@")[0]}</span>
                    )}
                  </div>
                  <time className="shrink-0 text-xs text-[var(--color-text-muted)]">
                    {new Date(log.created_at).toLocaleDateString()}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="space-y-10">
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold">Roles</h2>
            {roles.length === 0 ? (
              <Link to="/admin/roles" className="text-sm text-[var(--color-accent)] hover:underline">
                Create your first role
              </Link>
            ) : (
              <ul className="space-y-1">
                {roles.slice(0, 5).map((role) => (
                  <li key={role.id}>
                    <Link
                      to={`/admin/roles/${role.id}`}
                      className="-mx-2 flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--color-surface-hover)]"
                    >
                      <span className="text-sm font-medium">{role.name}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {role.permissions?.length ?? 0} permissions
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold">Members</h2>
            <ul className="space-y-3">
              {users.slice(0, 5).map((member) => (
                <li key={member.user_id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{member.name}</div>
                    <div className="truncate text-xs text-[var(--color-text-muted)]">{member.email}</div>
                  </div>
                  <Badge>{member.role}</Badge>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
