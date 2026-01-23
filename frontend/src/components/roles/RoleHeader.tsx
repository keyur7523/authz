import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useState } from "react";

export function RoleHeader({
  name,
  description,
}: {
  name: string;
  description: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [roleName, setRoleName] = useState(name);
  const [roleDesc, setRoleDesc] = useState(description ?? "");

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {editing ? (
            <>
              <Input
                label="Role name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
              <Input
                label="Description"
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
              />
            </>
          ) : (
            <>
              <div className="text-lg font-semibold">{roleName}</div>
              <div className="text-sm text-[var(--color-text-muted)]">
                {roleDesc}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="secondary" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button disabled>Save</Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>Edit</Button>
          )}
        </div>
      </div>
    </Card>
  );
}
