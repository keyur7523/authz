import { type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]",
        className
      )}
      {...props}
    />
  );
}

export function StatusBadge({
  status,
}: {
  status: "pending" | "approved" | "denied" | "expired";
}) {
  const map = {
    pending: ["Pending", "bg-[var(--color-warning)]"],
    approved: ["Approved", "bg-[var(--color-success)]"],
    denied: ["Denied", "bg-[var(--color-error)]"],
    expired: ["Expired", "bg-[var(--color-text-muted)]"],
  };

  const [label, dot] = map[status];

  return (
    <Badge className="gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </Badge>
  );
}
