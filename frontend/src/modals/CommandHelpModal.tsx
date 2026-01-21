import { AnimatePresence, motion } from "framer-motion";
import { Card } from "../components/ui/Card";

export function CommandHelpModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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
            className="fixed left-1/2 top-1/2 z-[60] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <Card>
              <div className="text-sm font-semibold mb-2">Keyboard shortcuts</div>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Open command/help</span>
                  <kbd>Cmd/Ctrl + K</kbd>
                </li>
                <li className="flex justify-between">
                  <span>Close modal</span>
                  <kbd>Esc</kbd>
                </li>
              </ul>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
