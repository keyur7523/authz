import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { cn } from "../../lib/utils";
import { type Command } from "./commands";

export function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return commands;

    return commands.filter((c) => {
      const hay = [
        c.title,
        c.subtitle ?? "",
        ...(c.keywords ?? []),
        c.group,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(t);
    });
  }, [q, commands]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(filtered.length - 1, i + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[active];
        if (cmd) {
          onClose();
          cmd.run();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, active, onClose]);

  const grouped = useMemo(() => {
    const nav = filtered.filter((c) => c.group === "Navigate");
    const act = filtered.filter((c) => c.group === "Actions");
    return { nav, act };
  }, [filtered]);

  const renderGroup = (title: string, items: Command[], baseIndex: number) => {
    if (!items.length) return null;
    return (
      <div className="py-2">
        <div className="px-3 pb-2 text-xs text-[var(--color-text-muted)]">
          {title}
        </div>
        <div className="space-y-1">
          {items.map((c, idx) => {
            const index = baseIndex + idx;
            const isActive = index === active;
            return (
              <button
                key={c.id}
                onMouseEnter={() => setActive(index)}
                onClick={() => {
                  onClose();
                  c.run();
                }}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left transition-colors",
                  "hover:bg-[var(--color-surface-hover)]",
                  isActive && "bg-[var(--color-surface-hover)]"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{c.title}</div>
                    {c.subtitle && (
                      <div className="text-xs text-[var(--color-text-muted)]">
                        {c.subtitle}
                      </div>
                    )}
                  </div>
                  {c.shortcut && (
                    <kbd className="text-xs text-[var(--color-text-muted)]">
                      {c.shortcut}
                    </kbd>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // active index mapping across groups
  const navCount = grouped.nav.length;

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
            className="fixed left-1/2 top-1/2 z-[60] w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <Card className="p-3">
              <Input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type a command…"
              />

              <div className="mt-2 max-h-[60vh] overflow-auto">
                {filtered.length === 0 ? (
                  <div className="px-3 py-6 text-sm text-[var(--color-text-muted)]">
                    No results.
                  </div>
                ) : (
                  <>
                    {renderGroup("Navigate", grouped.nav, 0)}
                    {renderGroup("Actions", grouped.act, navCount)}
                  </>
                )}
              </div>

              <div className="mt-2 flex justify-between px-3 text-xs text-[var(--color-text-muted)]">
                <span>↑↓ to navigate • Enter to select</span>
                <span>Esc to close</span>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
