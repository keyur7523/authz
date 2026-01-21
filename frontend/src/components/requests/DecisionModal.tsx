import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Textarea";
import { Field } from "../../components/ui/Field";

export function DecisionModal({
  open,
  mode,
  onClose,
  onConfirm,
}: {
  open: boolean;
  mode: "approve" | "deny";
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const title = mode === "approve" ? "Approve request" : "Deny request";

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
                Optional note for audit trail.
              </div>

              <div className="mt-4">
                <Field label="Note" hint="Optional. Stored in audit trail.">
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note..."
                  />
                </Field>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant={mode === "approve" ? "success" : "danger"}
                  onClick={() => onConfirm(note)}
                >
                  Confirm
                </Button>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
