import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesApi } from "../../api/endpoints";

export function RoleHeader({
  roleId,
  name,
  description,
}: {
  roleId: string;
  name: string;
  description: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [roleName, setRoleName] = useState(name);
  const [roleDesc, setRoleDesc] = useState(description ?? "");
  const qc = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: () =>
      rolesApi.update(roleId, { name: roleName, description: roleDesc }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles", roleId] });
      qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
      setEditing(false);
    },
  });

  const handleCancel = () => {
    setRoleName(name);
    setRoleDesc(description ?? "");
    setEditing(false);
  };

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
          {updateMutation.isError && (
            <div className="text-xs text-red-400">
              Failed to update role. Please try again.
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={
                  updateMutation.isPending ||
                  !roleName.trim() ||
                  (roleName === name && roleDesc === (description ?? ""))
                }
              >
                {updateMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>Edit</Button>
          )}
        </div>
      </div>
    </Card>
  );
}
