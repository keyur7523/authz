import { useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useToast } from "../hooks/useToast";
import { mockRequests, type AccessRequest } from "../components/requests/requests.mock";
import { RequestsTable } from "../components/requests/RequestsTable";
import { RequestDetail } from "../components/requests/RequestDetail";
import { DecisionModal } from "../components/requests/DecisionModal";

type Tab = "pending" | "approved" | "denied" | "all";

export function Requests() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("pending");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(mockRequests[0]?.id ?? null);

  const [data, setData] = useState<AccessRequest[]>(mockRequests);
  const [decision, setDecision] = useState<{ open: boolean; mode: "approve" | "deny" }>({
    open: false,
    mode: "approve",
  });

  const searchRef = useRef<HTMLInputElement | null>(null);

  useHotkeys("/", (e) => {
    e.preventDefault();
    searchRef.current?.focus();
  });

  useHotkeys("esc", () => {
    if (document.activeElement === searchRef.current) {
      setQ("");
      searchRef.current?.blur();
    }
  });

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data
      .filter((r) => (tab === "all" ? true : r.status === tab))
      .filter((r) => {
        if (!t) return true;
        return (
          r.requester.name.toLowerCase().includes(t) ||
          r.requester.email.toLowerCase().includes(t) ||
          r.roleName.toLowerCase().includes(t) ||
          r.scope.toLowerCase().includes(t)
        );
      });
  }, [data, tab, q]);

  // J/K selection navigation (list-style triage)
  useHotkeys("j", () => {
    if (!rows.length) return;
    const idx = Math.max(0, rows.findIndex((r) => r.id === selectedId));
    const next = rows[Math.min(rows.length - 1, idx + 1)];
    if (next) setSelectedId(next.id);
  });

  useHotkeys("k", () => {
    if (!rows.length) return;
    const idx = Math.max(0, rows.findIndex((r) => r.id === selectedId));
    const prev = rows[Math.max(0, idx - 1)];
    if (prev) setSelectedId(prev.id);
  });

  const selected = useMemo(
    () => data.find((r) => r.id === selectedId) ?? null,
    [data, selectedId]
  );

  const decide = (mode: "approve" | "deny") => {
    if (!selected || selected.status !== "pending") return;
    setDecision({ open: true, mode });
  };

  const confirmDecision = () => {
    if (!selected) return;

    setData((prev) =>
      prev.map((r) =>
        r.id === selected.id
          ? { ...r, status: decision.mode === "approve" ? "approved" : "denied" }
          : r
      )
    );

    toast.success(
      decision.mode === "approve" ? "Request approved" : "Request denied",
      { description: selected.id }
    );

    setDecision((d) => ({ ...d, open: false }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Access Requests</div>
          <div className="mt-1 text-sm text-[var(--color-text-muted)]">
            Review and approve access requests.
          </div>
        </div>
      </div>

      <Card className="p-4 md:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <TabButton active={tab === "pending"} onClick={() => setTab("pending")}>Pending</TabButton>
            <TabButton active={tab === "approved"} onClick={() => setTab("approved")}>Approved</TabButton>
            <TabButton active={tab === "denied"} onClick={() => setTab("denied")}>Denied</TabButton>
            <TabButton active={tab === "all"} onClick={() => setTab("all")}>All</TabButton>
          </div>

          <div className="w-full sm:w-80">
            <Input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search requests… (Press /)"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RequestsTable rows={rows} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="lg:col-span-1">
          <RequestDetail
            request={selected}
            onApprove={() => decide("approve")}
            onDeny={() => decide("deny")}
          />
        </div>
      </div>

      <DecisionModal
        open={decision.open}
        mode={decision.mode}
        onClose={() => setDecision((d) => ({ ...d, open: false }))}
        onConfirm={() => confirmDecision()}
      />
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button variant={active ? "primary" : "secondary"} onClick={onClick}>
      {children}
    </Button>
  );
}
