import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ShieldCheck } from "lucide-react";
import { cn } from "../lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/roles", label: "Roles", icon: ShieldCheck },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const Nav = (
    <nav className="space-y-1 p-2">
      {nav.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              "hover:bg-[var(--color-surface-hover)]",
              isActive && "bg-[var(--color-surface-hover)]"
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] md:block">
        <div className="px-4 py-3 text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          AuthZ Platform
        </div>
        {Nav}
      </aside>

      {/* Mobile */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="fixed left-0 top-0 z-50 h-full w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] md:hidden"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
            >
              <div className="px-4 py-3 font-semibold">AuthZ Platform</div>
              {Nav}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
