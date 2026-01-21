import { useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { mockPermissions } from "../components/permissions/permissions.mock";
import { PermissionsTable } from "../components/permissions/PermissionsTable";
import { PermissionDetail } from "../components/permissions/PermissionDetail";
import { AssignPermissionModal } from "../components/permissions/AssignPermissionModal";

export function Permissions() {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [assignOpen, setAssignOpen] = useState(false);

  // permId -> roleIds (mock in-memory mapping)
  const [assigned, setAssigned] = useState<Record<string, string[]>>({
    p_roles_read: ["role_viewer", "role_admin"],
    p_roles_write: ["role_admin"],
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

  useHotkeys(
    "a",
    () => {
      if (selectedId) setAssignOpen(true);
    },
    { enabled: !!selectedId }
  );

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return mockPermissions;
    return mockPermissions.filter(
      (p) => p.key.toLowerCase().includes(t) || p.description.toLowerCase().includes(t)
    );
  }, [q]);

  const selected = useMemo(
    () => mockPermissions.find((p) => p.id === selectedId) ?? null,
    [selectedId]
  );

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setChecked((prev) => {
      const all = rows.map((r) => r.id);
      const allChecked = all.every((id) => prev.has(id));
      return allChecked ? new Set() : new Set(all);
    });
  };

  const targetPermissionIds =
    checked.size > 0 ? Array.from(checked) : selectedId ? [selectedId] : [];

  const applyAssign = (roleId: string) => {
    setAssigned((prev) => {
      const next = { ...prev };
      for (const pid of targetPermissionIds) {
        const current = new Set(next[pid] ?? []);
        current.add(roleId);
        next[pid] = Array.from(current);
      }
      return next;
    });
    setAssignOpen(false);
    setChecked(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Permissions</div>
          <div className="mt-1 text-sm text-[var(--color-text-muted)]">
            Manage permissions and assign them to roles.
          </div>
        </div>

        <Button
          variant="secondary"
          disabled={targetPermissionIds.length === 0}
          onClick={() => setAssignOpen(true)}
        >
          Assign ({targetPermissionIds.length || 0})
        </Button>
      </div>

      <Card className="p-4 md:p-4">
        <Input
          ref={searchRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search permissions… (Press /)"
        />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PermissionsTable
            rows={rows}
            selectedId={selectedId}
            onSelect={setSelectedId}
            checkedIds={checked}
            onToggleCheck={toggleCheck}
            onToggleAll={toggleAll}
          />
        </div>
        <div className="lg:col-span-1">
          <PermissionDetail
            permission={selected}
            assignedRoleIds={selected ? assigned[selected.id] ?? [] : []}
            onAssignClick={() => setAssignOpen(true)}
          />
        </div>
      </div>

      <AssignPermissionModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        targetPermissionIds={targetPermissionIds}
        assignedByPermission={assigned}
        onApply={applyAssign}
      />
    </div>
  );
}
