import { motion, AnimatePresence } from "framer-motion";
import { type ReactNode } from "react";

export const FadeIn = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

export const Collapse = ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{ overflow: "hidden" }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);
