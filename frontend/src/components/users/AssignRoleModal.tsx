import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Field } from "../../components/ui/Field";
import { Textarea } from "../../components/ui/Textarea";
import { Badge } from "../../components/ui/Badge";
import { useRoles } from "../../api/hooks/useRoles";
import { useUserRoles, useAssignRole } from "../../api/hooks/useUsers";
import { useAllRolePermissions } from "../../api/hooks/useRolePermissions";
import { useToast } from "../../hooks/useToast";

export function AssignRoleModal({
  open,
  onClose,
  userId,
  userName,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}) {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [reason, setReason] = useState("");

  const { data: allRoles = [] } = useRoles();
  const { data: userRoleIds = [] } = useUserRoles(userId);
  const { data: rolePermissions = {} } = useAllRolePermissions();
  const assignMutation = useAssignRole();

  const userRoleIdSet = useMemo(
    () => new Set(userRoleIds.map((ur) => ur.role_id)),
    [userRoleIds]
  );

  const roles = useMemo(() => {
    const t = q.trim().toLowerCase();
    const available = allRoles.filter((r) => !userRoleIdSet.has(r.id));
    if (!t) return available;
    return available.filter(
      (r) => r.name.toLowerCase().includes(t) || (r.description?.toLowerCase().includes(t) ?? false)
    );
  }, [q, allRoles, userRoleIdSet]);

  const isHighRisk = (roleId: string) => {
    const perms = rolePermissions[roleId] ?? [];
    return perms.some((p) => p.includes("write"));
  };

  const handleAssign = (roleId: string) => {
    if (!reason.trim()) {
      toast.warning("Please provide a reason for assignment");
      return;
    }

    assignMutation.mutate(
      { userId, roleId },
      {
        onSuccess: () => {
          toast.success("Role assigned successfully");
          setReason("");
          onClose();
        },
        onError: (err: any) => {
          if (err?.requestId) {
            toast.info("High-risk role requires approval", {
              description: `Request ${err.requestId} created`,
            });
            setReason("");
            onClose();
          } else {
            toast.error("Failed to assign role");
          }
        },
      }
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed left-1/2 top-1/2 z-[60] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <Card>
              <div className="text-sm font-semibold">Assign role to {userName}</div>
              <div className="mt-1 text-sm text-[var(--color-text-muted)]">
                Select a role to assign. High-risk roles require approval.
              </div>

              <div className="mt-4 space-y-3">
                <Field label="Search">
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search roles…"
                  />
                </Field>

                <Field label="Reason" hint="Required. Stored in audit trail.">
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why are you assigning this role?"
                  />
                </Field>

                <div className="max-h-60 overflow-auto rounded-lg border border-[var(--color-border)]">
                  {roles.map((r) => {
                    const highRisk = isHighRisk(r.id);
                    return (
                      <button
                        key={r.id}
                        onClick={() => handleAssign(r.id)}
                        disabled={assignMutation.isPending}
                        className="flex w-full items-start justify-between gap-3 border-b border-[var(--color-border-muted)] px-4 py-3 text-left hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
                      >
                        <div>
                          <div className="text-sm font-medium flex items-center gap-2">
                            {r.name}
                            {highRisk && (
                              <Badge className="bg-[var(--color-warning-muted)] text-[var(--color-warning-text)]">
                                Requires approval
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)]">
                            {r.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {!roles.length && (
                    <div className="p-4 text-sm text-[var(--color-text-muted)]">
                      {userRoleIds.length === allRoles.length
                        ? "All roles already assigned."
                        : "No matching roles."}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
