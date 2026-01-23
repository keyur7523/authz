import { useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { QueryState } from "../components/ui/QueryState";
import { useUsers } from "../api/hooks/useUsers";
import { UsersTable } from "../components/users/UsersTable";
import { UserDetail } from "../components/users/UserDetail";
import { AssignRoleModal } from "../components/users/AssignRoleModal";
import { toUser } from "../components/users/users.mock";

export function Users() {
  const usersQuery = useUsers();
  const members = usersQuery.data ?? [];
  const users = useMemo(() => members.map(toUser), [members]);

  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

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
    if (!t) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(t) ||
        u.email.toLowerCase().includes(t)
    );
  }, [q, users]);

  // J/K navigation
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

  // Auto-select first when data loads
  useMemo(() => {
    if (!selectedId && users.length > 0) {
      setSelectedId(users[0].id);
    }
  }, [users, selectedId]);

  const selected = useMemo(
    () => users.find((u) => u.id === selectedId) ?? null,
    [users, selectedId]
  );

  return (
    <QueryState
      isLoading={usersQuery.isLoading}
      isError={usersQuery.isError}
      error={usersQuery.error}
      onRetry={() => usersQuery.refetch()}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Users</div>
            <div className="mt-1 text-sm text-[var(--color-text-muted)]">
              Manage users and their role assignments.
            </div>
          </div>
        </div>

        <Card className="p-4 md:p-4">
          <Input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search users… (Press /)"
          />
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UsersTable rows={rows} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          <div className="lg:col-span-1">
            <UserDetail user={selected} onAssignClick={() => setAssignOpen(true)} />
          </div>
        </div>

        {selected && (
          <AssignRoleModal
            open={assignOpen}
            onClose={() => setAssignOpen(false)}
            userId={selected.id}
            userName={selected.name}
          />
        )}
      </div>
    </QueryState>
  );
}
