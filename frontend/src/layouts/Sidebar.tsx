import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShieldCheck,
  Key,
  Users,
  Inbox,
  ScrollText,
} from "lucide-react";
import { cn } from "../lib/utils";
import { panelMotion, project, scrimMotion } from "../lib/motion";

const DRAWER_WIDTH = 256;

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/roles", label: "Roles", icon: ShieldCheck },
  { to: "/admin/permissions", label: "Permissions", icon: Key },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/requests", label: "Requests", icon: Inbox },
  { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
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
              "press flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
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
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
              onClick={onClose}
              {...scrimMotion}
            />
            <motion.aside
              className="fixed left-0 top-0 z-50 h-full w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] md:hidden"
              // Slides in and out along the same edge; drag tracks the finger 1:1
              initial={{ x: -DRAWER_WIDTH }}
              animate={{ x: 0 }}
              exit={{ x: -DRAWER_WIDTH }}
              transition={panelMotion.transition}
              drag="x"
              dragConstraints={{ left: -DRAWER_WIDTH, right: 0 }}
              dragElastic={{ left: 0, right: 0.1 }}
              dragMomentum={false}
              dragSnapToOrigin
              onDragEnd={(_, info) => {
                // Decide from where the flick is heading, not where the finger let go
                if (info.offset.x + project(info.velocity.x) < -DRAWER_WIDTH / 2) onClose();
              }}
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
