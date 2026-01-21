import { useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { mockAudit } from "../components/audit/audit.mock";
import { AuditTable } from "../components/audit/AuditTable";
import { AuditDetail } from "../components/audit/AuditDetail";
import { exportAuditCsv } from "../components/audit/exportCsv";
import { Field } from "../components/ui/Field";
import { Select } from "../components/ui/Select";

type DecisionFilter = "all" | "allow" | "deny" | "none";
type TimePreset = "all" | "1h" | "24h" | "7d";

export function Audit() {
  const [q, setQ] = useState("");
  const [decision, setDecision] = useState<DecisionFilter>("all");
  const [time, setTime] = useState<TimePreset>("24h");
  const [selectedId, setSelectedId] = useState<string | null>(mockAudit[0]?.id ?? null);

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
    const now = Date.now();
    const cutoff =
      time === "1h" ? now - 3600_000 : time === "24h" ? now - 86_400_000 : time === "7d" ? now - 604_800_000 : 0;

    const t = q.trim().toLowerCase();

    return mockAudit
      .filter((e) => (cutoff ? new Date(e.ts).getTime() >= cutoff : true))
      .filter((e) => {
        if (decision === "all") return true;
        if (decision === "none") return !e.decision;
        return e.decision === decision;
      })
      .filter((e) => {
        if (!t) return true;
        const blob = [
          e.id,
          e.actor.name,
          e.actor.email,
          e.action,
          `${e.resource.type}:${e.resource.id}`,
          e.scope,
          e.decision ?? "",
          JSON.stringify(e.metadata ?? {}),
        ]
          .join(" ")
          .toLowerCase();
        return blob.includes(t);
      });
  }, [q, decision, time]);

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
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Audit Log</div>
          <div className="mt-1 text-sm text-[var(--color-text-muted)]">
            Immutable record of authorization and admin actions.
          </div>
        </div>

        <Button variant="secondary" onClick={() => exportAuditCsv(rows)}>
          Export CSV
        </Button>
      </div>

      <Card className="p-4 md:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Search">
            <Input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search audit… (Press /)"
            />
          </Field>

          <Field label="Decision">
            <Select value={decision} onChange={(e) => setDecision(e.target.value as DecisionFilter)}>
              <option value="all">All</option>
              <option value="allow">Allow</option>
              <option value="deny">Deny</option>
              <option value="none">None</option>
            </Select>
          </Field>

          <Field label="Time range">
            <Select value={time} onChange={(e) => setTime(e.target.value as TimePreset)}>
              <option value="1h">Last hour</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7d</option>
              <option value="all">All</option>
            </Select>
          </Field>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AuditTable rows={rows} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="lg:col-span-1">
          <AuditDetail event={selected} />
        </div>
      </div>
    </div>
  );
}
