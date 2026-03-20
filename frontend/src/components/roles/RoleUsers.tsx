import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useUsers } from "../../api/hooks/useUsers";
import { useQuery } from "@tanstack/react-query";
import { userRolesApi, type OrgMember } from "../../api/endpoints";

function UserWithRoleCheck({
  user,
  roleId,
}: {
  user: OrgMember;
  roleId: string;
}) {
  const rolesQuery = useQuery({
    queryKey: ["user-roles", user.user_id],
    queryFn: () => userRolesApi.getForUser(user.user_id),
    staleTime: 30_000,
  });

  const hasRole = rolesQuery.data?.some((r) => r.role_id === roleId) ?? false;

  if (rolesQuery.isLoading || !hasRole) return null;

  return (
    <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] p-2">
      <div>
        <div className="text-sm font-medium">{user.name}</div>
        <div className="text-xs text-[var(--color-text-muted)]">
          {user.email}
        </div>
      </div>
      <Badge>Assigned</Badge>
    </div>
  );
}

export function RoleUsers({ roleId }: { roleId: string }) {
  const usersQuery = useUsers();
  const users = usersQuery.data ?? [];

  return (
    <Card>
      <div className="text-sm font-semibold mb-2">Users</div>
      {usersQuery.isLoading ? (
        <div className="text-sm text-[var(--color-text-muted)]">Loading…</div>
      ) : users.length === 0 ? (
        <div className="text-sm text-[var(--color-text-muted)]">
          No users in this organization yet.
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <UserWithRoleCheck key={u.user_id} user={u} roleId={roleId} />
          ))}
        </div>
      )}
    </Card>
  );
}
