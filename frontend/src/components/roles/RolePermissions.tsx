import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

const mockPermissions = [
  "users.read",
  "users.write",
  "roles.read",
  "roles.write",
  "audit.read",
];

export function RolePermissions() {
  return (
    <Card>
      <div className="text-sm font-semibold mb-2">Permissions</div>
      <div className="flex flex-wrap gap-2">
        {mockPermissions.map((p) => (
          <Badge key={p}>{p}</Badge>
        ))}
      </div>
    </Card>
  );
}
