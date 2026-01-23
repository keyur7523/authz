import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { type User } from "./users.mock";
import { useUserRoles } from "../../api/hooks/useUsers";
import { useRoles } from "../../api/hooks/useRoles";

export function UserDetail({
  user,
  onAssignClick,
}: {
  user: User | null;
  onAssignClick: () => void;
}) {
  const { data: userRoles = [], isLoading: loadingRoles } = useUserRoles(user?.id ?? "");
  const { data: allRoles = [] } = useRoles();
  const roleIds = userRoles.map((ur) => ur.role_id);

  if (!user) {
    return (
      <Card>
        <div className="text-sm font-semibold">Select a user</div>
        <div className="mt-1 text-sm text-[var(--color-text-muted)]">
          View user details and assigned roles.
        </div>
      </Card>
    );
  }

  const assignedRoles = allRoles.filter((r) => roleIds.includes(r.id));

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{user.name}</div>
          <div className="text-sm text-[var(--color-text-muted)]">{user.email}</div>
        </div>
        <Badge
          className={
            user.status === "active"
              ? "bg-[var(--color-success-muted)] text-[var(--color-success-text)]"
              : "bg-[var(--color-error-muted)] text-[var(--color-error-text)]"
          }
        >
          {user.status}
        </Badge>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-[var(--color-text-muted)]">Assigned roles</div>
          <Button variant="ghost" size="sm" onClick={onAssignClick}>
            + Assign
          </Button>
        </div>

        {loadingRoles ? (
          <div className="text-sm text-[var(--color-text-muted)]">Loading...</div>
        ) : assignedRoles.length ? (
          <div className="space-y-2">
            {assignedRoles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between rounded-md border border-[var(--color-border)] p-2"
              >
                <div>
                  <div className="text-sm font-medium">{role.name}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {role.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[var(--color-text-muted)]">No roles assigned.</div>
        )}
      </div>
    </Card>
  );
}
