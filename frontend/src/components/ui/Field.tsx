import { type ReactNode } from "react";
import { cn } from "../../lib/utils";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="mb-1.5 text-sm font-medium text-[var(--color-text-secondary)]">
          {label}
        </div>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-[var(--color-error-text)]">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
