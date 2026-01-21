import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

const mockUsers = [
  { id: "u1", name: "John Doe", email: "john@company.com" },
  { id: "u2", name: "Jane Smith", email: "jane@company.com" },
];

export function RoleUsers() {
  return (
    <Card>
      <div className="text-sm font-semibold mb-2">Users</div>
      <div className="space-y-2">
        {mockUsers.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between rounded-md border border-[var(--color-border)] p-2"
          >
            <div>
              <div className="text-sm font-medium">{u.name}</div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {u.email}
              </div>
            </div>
            <Badge>Assigned</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
