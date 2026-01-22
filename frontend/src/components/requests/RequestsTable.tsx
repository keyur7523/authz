import { type AccessRequest } from "./requests.mock";
import { cn, formatRelativeTime } from "../../lib/utils";
import { Badge, StatusBadge } from "../../components/ui/Badge";

export function RequestsTable({
  rows,
  selectedId,
  onSelect,
}: {
  rows: AccessRequest[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="grid grid-cols-12 gap-3 border-b border-[var(--color-border-muted)] px-4 py-3 text-xs text-[var(--color-text-muted)]">
        <div className="col-span-4">Requester</div>
        <div className="col-span-3">Role</div>
        <div className="col-span-3 hidden sm:block">Scope</div>
        <div className="col-span-2 text-right">Created</div>
      </div>

      {rows.map((r) => {
        const isSelected = r.id === selectedId;

        return (
          <button
            key={r.id}
            onClick={() => onSelect(r.id)}
            className={cn(
              "grid w-full grid-cols-12 gap-3 px-4 py-3 text-left text-sm border-b border-[var(--color-border-muted)] transition-colors",
              "hover:bg-[var(--color-surface-hover)]",
              isSelected && "bg-[var(--color-surface-hover)]"
            )}
          >
            <div className="col-span-4">
              <div className="font-medium text-[var(--color-text)] flex items-center gap-2">
                {r.requester.name}
                {r.status === "pending" ? (
                  <StatusBadge status="pending" />
                ) : r.status === "approved" ? (
                  <StatusBadge status="approved" />
                ) : (
                  <StatusBadge status="denied" />
                )}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {r.requester.email}
              </div>
            </div>

            <div className="col-span-3">
              <div className="font-medium">{r.roleName}</div>
              <div className="text-xs text-[var(--color-text-muted)] truncate" title={r.roleId}>
                {r.roleId}
              </div>
            </div>

            <div
              className="col-span-3 hidden sm:block text-[var(--color-text-secondary)] truncate"
              title={r.scope}
            >
              {r.scope}
            </div>

            <div className="col-span-2 flex items-start justify-end">
              <Badge
                className={cn(
                  r.risk === "high" && "bg-[var(--color-error-muted)] text-[var(--color-error-text)]",
                  r.risk === "medium" && "bg-[var(--color-warning-muted)] text-[var(--color-warning-text)]",
                  r.risk === "low" && "bg-[var(--color-success-muted)] text-[var(--color-success-text)]"
                )}
              >
                {formatRelativeTime(r.createdAt)}
              </Badge>
            </div>
          </button>
        );
      })}
    </div>
  );
}
