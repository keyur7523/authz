import { AnimatePresence, motion } from "framer-motion";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useMemo, useState } from "react";
import { useRoles } from "../../api/hooks/useRoles";

export function AssignPermissionModal({
  open,
  onClose,
  targetPermissionIds,
  assignedByPermission: _assignedByPermission,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  targetPermissionIds: string[];
  assignedByPermission: Record<string, string[]>;
  onApply: (roleId: string) => void;
}) {
  const [q, setQ] = useState("");
  const rolesQuery = useRoles();
  const apiRoles = rolesQuery.data ?? [];

  const roles = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return apiRoles;
    return apiRoles.filter(
      (r) =>
        r.name.toLowerCase().includes(t) ||
        (r.description?.toLowerCase().includes(t) ?? false)
    );
  }, [q, apiRoles]);

  const title =
    targetPermissionIds.length === 1
      ? "Assign permission"
      : `Assign ${targetPermissionIds.length} permissions`;

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
              <div className="text-sm font-semibold">{title}</div>
              <div className="mt-1 text-sm text-[var(--color-text-muted)]">
                Select a role to assign.
              </div>

              <div className="mt-4">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search roles…"
                />
              </div>

              <div className="mt-4 space-y-2 max-h-72 overflow-auto pr-1">
                {rolesQuery.isLoading ? (
                  <div className="text-sm text-[var(--color-text-muted)] p-3">
                    Loading roles…
                  </div>
                ) : roles.length === 0 ? (
                  <div className="text-sm text-[var(--color-text-muted)] p-3">
                    No roles found.
                  </div>
                ) : (
                  roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onApply(r.id)}
                      className="w-full rounded-md border border-[var(--color-border)] p-3 text-left hover:bg-[var(--color-surface-hover)] transition-colors"
                    >
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        {r.description ?? "No description"}
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="mt-4 flex justify-end gap-2">
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
