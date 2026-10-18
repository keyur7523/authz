import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { panelMotion, scrimMotion } from "../../lib/motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { rolesApi } from "../../api/endpoints";

export function CreateRoleModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const createRole = useMutation({
    mutationFn: () => rolesApi.create({ name: name.trim(), description: description.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["audit"] });
      setName("");
      setDescription("");
      setError("");
      onClose();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail || err?.message || "Failed to create role");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Role name is required");
      return;
    }
    if (name.trim().length > 100) {
      setError("Role name must be 100 characters or less");
      return;
    }
    setError("");
    createRole.mutate();
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            onClick={handleClose}
            {...scrimMotion}
          />
          <motion.div
            className="fixed left-1/2 top-1/2 z-[60] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2"
            {...panelMotion}
          >
            <Card>
              <form onSubmit={handleSubmit}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold">Create role</div>
                    <div className="mt-1 text-sm text-[var(--color-text-muted)]">
                      Define a new role for your organization.
                    </div>
                  </div>
                  <Button variant="ghost" type="button" onClick={handleClose}>
                    Close
                  </Button>
                </div>

                <div className="mt-4 space-y-4">
                  <Input
                    label="Role name"
                    placeholder="e.g. Editor, Viewer, Billing Admin"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={error && !name.trim() ? error : undefined}
                    autoFocus
                    maxLength={100}
                  />

                  <div className="w-full">
                    <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                      Description (optional)
                    </label>
                    <Textarea
                      placeholder="What can this role do?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={500}
                      rows={3}
                    />
                  </div>
                </div>

                {error && name.trim() && (
                  <p className="mt-3 text-sm text-[var(--color-error-text)]">{error}</p>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="secondary" type="button" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createRole.isPending || !name.trim()}>
                    {createRole.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
