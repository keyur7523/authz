import { Card } from "../components/ui/Card";
import { useRoles } from "../api/hooks/useRoles";
import { usePermissions } from "../api/hooks/usePermissions";
import { useUsers } from "../api/hooks/useUsers";
import { useAuditPaginated } from "../api/hooks/useAudit";
import { Badge } from "../components/ui/Badge";
import { Link } from "react-router-dom";

function StatCard({
  label,
  value,
  to,
}: {
  label: string;
  value: number | string;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="hover:border-[var(--color-primary)] transition-colors cursor-pointer">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
      </Card>
    </Link>
  );
}

export function Dashboard() {
  const rolesQuery = useRoles();
  const permissionsQuery = usePermissions();
  const usersQuery = useUsers();
  const auditQuery = useAuditPaginated({ limit: 8 });

  const roles = rolesQuery.data ?? [];
  const permissions = permissionsQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const auditData = auditQuery.data;
  const recentLogs = auditData?.logs ?? [];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold">Dashboard</div>
        <div className="mt-1 text-sm text-[var(--color-text-muted)]">
          Authorization platform overview
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Roles"
          value={roles.length}
          to="/admin/roles"
        />
        <StatCard
          label="Permissions"
          value={permissions.length}
          to="/admin/permissions"
        />
        <StatCard
          label="Users"
          value={users.length}
          to="/admin/users"
        />
        <StatCard
          label="Audit Events"
          value={auditData?.total ?? 0}
          to="/admin/audit"
        />
      </div>

      {/* Recent activity */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Recent Activity</div>
          <Link
            to="/admin/audit"
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            View all →
          </Link>
        </div>
        {recentLogs.length === 0 ? (
          <div className="text-sm text-[var(--color-text-muted)]">
            No activity yet.
          </div>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-md border border-[var(--color-border)] p-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    className={
                      log.action.includes("delete")
                        ? "bg-red-500/20 text-red-400"
                        : log.action.includes("create")
                        ? "bg-green-500/20 text-green-400"
                        : undefined
                    }
                  >
                    {log.action}
                  </Badge>
                  <span className="text-xs text-[var(--color-text-muted)] truncate">
                    {log.resource_type}
                    {log.actor_email ? ` · ${log.actor_email.split("@")[0]}` : ""}
                  </span>
                </div>
                <span className="text-xs text-[var(--color-text-muted)] shrink-0 ml-2">
                  {new Date(log.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <div className="text-sm font-semibold mb-3">Top Roles</div>
          {roles.length === 0 ? (
            <div className="text-sm text-[var(--color-text-muted)]">
              No roles created yet.
            </div>
          ) : (
            <div className="space-y-2">
              {roles.slice(0, 5).map((role) => (
                <Link
                  key={role.id}
                  to={`/admin/roles/${role.id}`}
                  className="flex items-center justify-between rounded-md border border-[var(--color-border)] p-2.5 hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <span className="text-sm font-medium">{role.name}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {role.permissions?.length ?? 0} permissions
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="text-sm font-semibold mb-3">Team Members</div>
          {users.length === 0 ? (
            <div className="text-sm text-[var(--color-text-muted)]">
              No members yet.
            </div>
          ) : (
            <div className="space-y-2">
              {users.slice(0, 5).map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between rounded-md border border-[var(--color-border)] p-2.5"
                >
                  <div>
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {user.email}
                    </div>
                  </div>
                  <Badge>{user.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
