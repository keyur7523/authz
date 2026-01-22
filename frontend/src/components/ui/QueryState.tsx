import { type ReactNode } from "react";
import { Card } from "./Card";
import { Button } from "./Button";

export function QueryState({
  isLoading,
  isError,
  error,
  onRetry,
  loading,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
  loading?: ReactNode;
  children: ReactNode;
}) {
  if (isLoading) return <>{loading ?? <DefaultLoading />}</>;
  if (isError) {
    return (
      <Card>
        <div className="text-sm font-semibold">Something went wrong</div>
        <div className="mt-1 text-sm text-[var(--color-text-muted)]">
          {getErrorMessage(error)}
        </div>
        {onRetry && (
          <div className="mt-4">
            <Button onClick={onRetry}>Retry</Button>
          </div>
        )}
      </Card>
    );
  }
  return <>{children}</>;
}

function DefaultLoading() {
  return (
    <Card>
      <div className="text-sm text-[var(--color-text-muted)]">Loading…</div>
    </Card>
  );
}

function getErrorMessage(err: unknown) {
  if (!err) return "Unknown error.";
  if (typeof err === "string") return err;
  if (typeof err === "object" && err && "message" in err) return String((err as any).message);
  return "Unexpected error.";
}
