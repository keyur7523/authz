import { type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]",
        "border-[var(--color-border)] transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
