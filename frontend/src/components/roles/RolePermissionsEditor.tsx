import { useMemo, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Textarea } from "../../components/ui/Textarea";
import { usePermissions } from "../../api/hooks/usePermissions";
import { useRolePermissions, useSaveRolePermissions } from "../../api/hooks/useRolePermissions";

export function RolePermissionsEditor({ roleId }: { roleId: string }) {
  const { data: all = [], isLoading: loadingAll } = usePermissions();
  const { data: assigned = [], isLoading: loadingAssigned } = useRolePermissions(roleId);
  const save = useSaveRolePermissions(roleId);

  const [q, setQ] = useState("");
  const [note, setNote] = useState("");

  const [local, setLocal] = useState<Set<string> | null>(null);

  const effective = local ?? new Set(assigned);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return all;
    return all.filter((p) => (p.name + " " + (p.description ?? "")).toLowerCase().includes(t));
  }, [q, all]);

  const toggle = (pid: string) => {
    setLocal((prev) => {
      const next = new Set(prev ?? assigned);
      next.has(pid) ? next.delete(pid) : next.add(pid);
      return next;
    });
  };

  const dirty = local !== null;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Permissions</div>
          <div className="mt-1 text-sm text-[var(--color-text-muted)]">
            Assign permissions to this role.
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={!dirty || save.isPending}
            onClick={() => setLocal(null)}
          >
            Reset
          </Button>
          <Button
            disabled={!dirty || save.isPending}
            onClick={() =>
              save.mutate({ permissionIds: Array.from(effective), note }, { onSuccess: () => setLocal(null) })
            }
          >
            Save
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <Field label="Search">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search permissions…" />
        </Field>

        <Field label="Audit note" hint="Optional. Stored in audit trail.">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why are you changing permissions?" />
        </Field>

        <div className="mt-2 overflow-hidden rounded-lg border border-[var(--color-border)]">
          {(loadingAll || loadingAssigned) ? (
            <div className="p-4 text-sm text-[var(--color-text-muted)]">Loading permissions…</div>
          ) : (
            <div className="max-h-72 overflow-auto">
              {filtered.map((p) => {
                const checked = effective.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className="flex w-full items-start justify-between gap-3 border-b border-[var(--color-border-muted)] px-4 py-3 text-left hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{p.description ?? ""}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      readOnly
                      className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
                    />
                  </button>
                );
              })}
              {!filtered.length && (
                <div className="p-4 text-sm text-[var(--color-text-muted)]">No matching permissions.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
