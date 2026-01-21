import { type AuditEvent } from "./audit.mock";

function esc(v: string) {
  const s = String(v ?? "");
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportAuditCsv(rows: AuditEvent[], filename = "audit.csv") {
  const headers = [
    "id",
    "ts",
    "actor_name",
    "actor_email",
    "action",
    "resource_type",
    "resource_id",
    "decision",
    "scope",
    "ip",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.ts,
        r.actor.name,
        r.actor.email,
        r.action,
        r.resource.type,
        r.resource.id,
        r.decision ?? "",
        r.scope,
        r.ip ?? "",
      ].map(esc).join(",")
    ),
  ].join("\n");

  const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
