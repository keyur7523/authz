import { type User } from "./users.mock";
import { cn } from "../../lib/utils";
import { Badge } from "../../components/ui/Badge";

export function UsersTable({
  rows,
  selectedId,
  onSelect,
}: {
  rows: User[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="grid grid-cols-12 gap-3 border-b border-[var(--color-border-muted)] px-4 py-3 text-xs text-[var(--color-text-muted)]">
        <div className="col-span-5">Name</div>
        <div className="col-span-5">Email</div>
        <div className="col-span-2 text-right">Status</div>
      </div>

      {rows.map((u) => {
        const isSelected = u.id === selectedId;

        return (
          <button
            key={u.id}
            onClick={() => onSelect(u.id)}
            className={cn(
              "grid w-full grid-cols-12 gap-3 px-4 py-3 text-left text-sm border-b border-[var(--color-border-muted)] transition-colors",
              "hover:bg-[var(--color-surface-hover)]",
              isSelected && "bg-[var(--color-surface-hover)]"
            )}
          >
            <div className="col-span-5">
              <div className="font-medium text-[var(--color-text)]">{u.name}</div>
              <div className="text-xs text-[var(--color-text-muted)] sm:hidden">
                {u.email}
              </div>
            </div>

            <div className="col-span-5 hidden sm:block text-[var(--color-text-secondary)]">
              {u.email}
            </div>

            <div className="col-span-2 flex justify-end">
              <Badge
                className={cn(
                  u.status === "active" && "bg-[var(--color-success-muted)] text-[var(--color-success-text)]",
                  u.status === "suspended" && "bg-[var(--color-error-muted)] text-[var(--color-error-text)]"
                )}
              >
                {u.status}
              </Badge>
            </div>
          </button>
        );
      })}

      {!rows.length && (
        <div className="p-4 text-sm text-[var(--color-text-muted)]">No users found.</div>
      )}
    </div>
  );
}
