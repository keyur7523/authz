import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { type Permission } from "./permissions.mock";
import { useRoles } from "../../api/hooks/useRoles";
import { useMemo } from "react";

export function PermissionDetail({
  permission,
  assignedRoleIds,
  onAssignClick,
}: {
  permission: Permission | null;
  assignedRoleIds: string[];
  onAssignClick: () => void;
}) {
  const rolesQuery = useRoles();
  const rolesMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of rolesQuery.data ?? []) {
      map[r.id] = r.name;
    }
    return map;
  }, [rolesQuery.data]);

  if (!permission) {
    return (
      <Card>
        <div className="text-sm font-semibold">Select a permission</div>
        <div className="mt-1 text-sm text-[var(--color-text-muted)]">
          Choose a permission to view details and assignments.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{permission.key}</div>
          <div className="mt-1 text-sm text-[var(--color-text-muted)]">
            {permission.description}
          </div>
        </div>
        <button
          onClick={onAssignClick}
          className="rounded-md border border-[var(--color-border)] px-3 py-2 text-xs hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          Assign to role
        </button>
      </div>

      <div className="mt-4">
        <div className="text-xs text-[var(--color-text-muted)] mb-2">Assigned roles</div>
        <div className="flex flex-wrap gap-2">
          {assignedRoleIds.length ? (
            assignedRoleIds.map((id) => (
              <Badge key={id}>{rolesMap[id] ?? id}</Badge>
            ))
          ) : (
            <span className="text-sm text-[var(--color-text-muted)]">None</span>
          )}
        </div>
      </div>
    </Card>
  );
}
