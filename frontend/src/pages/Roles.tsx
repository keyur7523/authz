import { useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { RolesTable } from "../components/roles/RolesTable";
import { CreateRoleModal } from "../components/roles/CreateRoleModal";
import { mockRoles } from "../components/roles/roles.mock";

export function Roles() {
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
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
    const query = q.trim().toLowerCase();
    if (!query) return mockRoles;
    return mockRoles.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query)
    );
  }, [q]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Roles</div>
          <div className="mt-1 text-sm text-[var(--color-text-muted)]">
            Manage roles and their associated permissions.
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ Create Role</Button>
      </div>

      <Card className="p-4 md:p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search roles… (Press /)"
            />
          </div>
          <Button variant="secondary" onClick={() => setQ("")}>
            Clear
          </Button>
        </div>
      </Card>

      <RolesTable rows={rows} />

      <CreateRoleModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
