import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { type AccessRequest } from "./requests.mock";

export function RequestDetail({
  request,
  onApprove,
  onDeny,
}: {
  request: AccessRequest | null;
  onApprove: () => void;
  onDeny: () => void;
}) {
  if (!request) {
    return (
      <Card>
        <div className="text-sm font-semibold">Select a request</div>
        <div className="mt-1 text-sm text-[var(--color-text-muted)]">
          Review request details and approve or deny.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{request.requester.name}</div>
          <div className="text-sm text-[var(--color-text-muted)]">
            {request.requester.email}
          </div>
        </div>
        <Badge>{request.risk} risk</Badge>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <Row k="Role" v={`${request.roleName} (${request.roleId})`} truncate />
        <Row k="Scope" v={request.scope} truncate />
        <Row k="Reason" v={request.reason} />
        <Row k="Status" v={request.status} />
        <Row k="Risk" v={request.risk} />
      </div>

      {request.status === "pending" && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={onDeny}
            className="flex-1 rounded-md bg-[var(--color-error)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-error-hover)] transition-colors"
          >
            Deny
          </button>
          <button
            onClick={onApprove}
            className="flex-1 rounded-md bg-[var(--color-success)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-success-hover)] transition-colors"
          >
            Approve
          </button>
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
