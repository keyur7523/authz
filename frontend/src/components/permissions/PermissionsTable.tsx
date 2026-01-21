import { cn } from "../../lib/utils";
import { type Permission } from "./permissions.mock";
import { Badge } from "../../components/ui/Badge";

export function PermissionsTable({
  rows,
  selectedId,
  onSelect,
  checkedIds,
  onToggleCheck,
  onToggleAll,
}: {
  rows: Permission[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  checkedIds: Set<string>;
  onToggleCheck: (id: string) => void;
  onToggleAll: () => void;
}) {
  const allChecked = rows.length > 0 && rows.every((r) => checkedIds.has(r.id));

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="grid grid-cols-12 gap-3 border-b border-[var(--color-border-muted)] px-4 py-3 text-xs text-[var(--color-text-muted)]">
        <div className="col-span-1">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={onToggleAll}
            className="h-4 w-4 accent-[var(--color-accent)]"
            aria-label="Select all"
          />
        </div>
        <div className="col-span-5">Permission</div>
        <div className="col-span-4 hidden sm:block">Description</div>
        <div className="col-span-2 text-right">Risk</div>
      </div>

      {rows.map((p) => {
        const isSelected = p.id === selectedId;
        const isChecked = checkedIds.has(p.id);

        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn(
              "grid w-full grid-cols-12 gap-3 px-4 py-3 text-left text-sm border-b border-[var(--color-border-muted)] transition-colors",
              "hover:bg-[var(--color-surface-hover)]",
              isSelected && "bg-[var(--color-surface-hover)]"
            )}
          >
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleCheck(p.id);
                }}
                className="h-4 w-4 accent-[var(--color-accent)]"
                aria-label={`Select ${p.key}`}
              />
            </div>

            <div className="col-span-5">
              <div className="font-medium text-[var(--color-text)]">{p.key}</div>
              <div className="text-xs text-[var(--color-text-muted)] sm:hidden">
                {p.description}
              </div>
            </div>

            <div className="col-span-4 hidden sm:block text-[var(--color-text-secondary)]">
              {p.description}
            </div>

            <div className="col-span-2 flex justify-end">
              <Badge
                className={cn(
                  p.risk === "high" && "bg-[var(--color-error-muted)] text-[var(--color-error-text)]",
                  p.risk === "medium" && "bg-[var(--color-warning-muted)] text-[var(--color-warning-text)]",
                  p.risk === "low" && "bg-[var(--color-success-muted)] text-[var(--color-success-text)]"
                )}
              >
                {p.risk}
              </Badge>
            </div>
          </button>
        );
      })}
    </div>
  );
}
