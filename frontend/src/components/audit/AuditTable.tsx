import { type AuditEvent } from "./audit.mock";
import { cn, formatRelativeTime } from "../../lib/utils";
import { Badge } from "../../components/ui/Badge";

export function AuditTable({
  rows,
  selectedId,
  onSelect,
}: {
  rows: AuditEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="grid grid-cols-12 gap-3 border-b border-[var(--color-border-muted)] px-4 py-3 text-xs text-[var(--color-text-muted)]">
        <div className="col-span-4">Actor</div>
        <div className="col-span-3">Action</div>
        <div className="col-span-3 hidden sm:block">Resource</div>
        <div className="col-span-2 text-right">Time</div>
      </div>

      {rows.map((e) => {
        const sel = e.id === selectedId;
        const decisionBadge =
          e.decision === "allow"
            ? "bg-[var(--color-success-muted)] text-[var(--color-success-text)]"
            : e.decision === "deny"
            ? "bg-[var(--color-error-muted)] text-[var(--color-error-text)]"
            : "";

        return (
          <button
            key={e.id}
            onClick={() => onSelect(e.id)}
            className={cn(
              "grid w-full grid-cols-12 gap-3 px-4 py-3 text-left text-sm border-b border-[var(--color-border-muted)] transition-colors",
              "hover:bg-[var(--color-surface-hover)]",
              sel && "bg-[var(--color-surface-hover)]"
            )}
          >
            <div className="col-span-4">
              <div className="font-medium text-[var(--color-text)]">{e.actor.name}</div>
              <div className="text-xs text-[var(--color-text-muted)]">{e.actor.email}</div>
            </div>

            <div className="col-span-3 flex items-start gap-2">
              <div className="font-medium">{e.action}</div>
              {e.decision && <Badge className={decisionBadge}>{e.decision}</Badge>}
            </div>

            <div
              className="col-span-3 hidden sm:block text-[var(--color-text-secondary)] truncate"
              title={`${e.resource.type}:${e.resource.id}`}
            >
              {e.resource.type}:{e.resource.id}
            </div>

            <div className="col-span-2 flex justify-end">
              <span className="text-xs text-[var(--color-text-muted)]">
                {formatRelativeTime(e.ts)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
