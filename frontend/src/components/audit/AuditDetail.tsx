import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { type AuditEvent } from "./audit.mock";

export function AuditDetail({ event }: { event: AuditEvent | null }) {
  if (!event) {
    return (
      <Card>
        <div className="text-sm font-semibold">Select an event</div>
        <div className="mt-1 text-sm text-[var(--color-text-muted)]">
          View full context for an audit record.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{event.action}</div>
          <div className="text-sm text-[var(--color-text-muted)] truncate" title={event.id}>
            {event.id}
          </div>
        </div>
        {event.decision && <Badge>{event.decision}</Badge>}
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <Row k="Timestamp" v={new Date(event.ts).toLocaleString()} />
        <Row k="Actor" v={`${event.actor.name} (${event.actor.email})`} truncate />
        <Row k="Resource" v={`${event.resource.type}:${event.resource.id}`} truncate />
        <Row k="Scope" v={event.scope} truncate />
        {event.ip && <Row k="IP" v={event.ip} />}
      </div>

      {event.metadata && (
        <div className="mt-4">
          <div className="text-xs text-[var(--color-text-muted)] mb-2">Metadata</div>
          <pre className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-3 text-xs overflow-auto">
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
}

function Row({ k, v, truncate }: { k: string; v: string; truncate?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-[var(--color-text-muted)] shrink-0">{k}</div>
      <div
        className={`text-right text-[var(--color-text)] ${truncate ? "truncate" : ""}`}
        title={truncate ? v : undefined}
      >
        {v}
      </div>
    </div>
  );
}
