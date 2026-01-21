import { type RoleRow } from "./roles.mock";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { Shield, Code2, Eye, CheckCircle2 } from "lucide-react";

function RoleIcon({ name }: { name: string }) {
  const map: Record<string, any> = {
    Admin: Shield,
    Developer: Code2,
    Viewer: Eye,
    Approver: CheckCircle2,
  };
  const Icon = map[name] ?? Shield;
  return <Icon className="h-4 w-4 text-[var(--color-text-secondary)]" />;
}

export function RolesTable({
  rows,
  isLoading,
}: {
  rows: RoleRow[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border-muted)] text-sm font-semibold">
          Roles
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-[var(--color-border)] opacity-50" />
          ))}
        </div>
      </Card>
    );
  }

  if (!rows.length) {
    return (
      <Card>
        <div className="text-sm font-semibold">No roles</div>
        <div className="mt-1 text-sm text-[var(--color-text-muted)]">
          Create your first role to start assigning permissions.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-[var(--color-border-muted)] text-xs text-[var(--color-text-muted)]">
        <div className="col-span-4">Name</div>
        <div className="col-span-4 hidden sm:block">Description</div>
        <div className="col-span-2 text-right">Permissions</div>
        <div className="col-span-1 text-right hidden sm:block">Users</div>
        <div className="col-span-1 text-right"> </div>
      </div>

      <div>
        {rows.map((r) => (
          <div
            key={r.id}
            className="grid grid-cols-12 gap-3 px-4 py-3 text-sm border-b border-[var(--color-border-muted)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <div className="col-span-4 flex items-center gap-2">
              <RoleIcon name={r.name} />
              <div className="min-w-0">
                <div className="font-medium text-[var(--color-text)] flex items-center gap-2">
                  {r.name}
                  {r.status === "active" ? (
                    <StatusBadge status="approved" />
                  ) : (
                    <StatusBadge status="expired" />
                  )}
                </div>
                <div className="text-xs text-[var(--color-text-muted)] sm:hidden truncate">
                  {r.description}
                </div>
              </div>
            </div>

            <div className="col-span-4 hidden sm:block text-[var(--color-text-secondary)]">
              {r.description}
            </div>

            <div className="col-span-2 text-right text-[var(--color-text-secondary)]">
              {r.permissionsCount}
            </div>

            <div className="col-span-1 text-right text-[var(--color-text-secondary)] hidden sm:block">
              {r.usersCount}
            </div>

            <div className="col-span-1 text-right">
              <Button variant="ghost">Edit</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
