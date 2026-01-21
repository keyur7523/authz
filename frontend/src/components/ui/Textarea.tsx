import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-md border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]",
        "border-[var(--color-border)] placeholder:text-[var(--color-text-muted)] transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
