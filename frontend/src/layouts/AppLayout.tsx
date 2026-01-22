import { Outlet, useNavigate } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";
import { useMemo, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "../components/command/CommandPalette";
import { useThemeStore } from "../stores/themeStore";
import { exportAuditCsv } from "../components/audit/exportCsv";
import { useAudit } from "../api/hooks/useAudit";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const navigate = useNavigate();

  const { resolvedTheme, setTheme } = useThemeStore();
  const { data: auditRows } = useAudit();

  useHotkeys("mod+k", (e) => {
    e.preventDefault();
    setCmdOpen(true);
  });

  useHotkeys("esc", () => setCmdOpen(false));

  const commands = useMemo(() => {
    return [
      // Navigate
      {
        id: "nav-dashboard",
        title: "Dashboard",
        subtitle: "Go to dashboard",
        shortcut: "G D",
        group: "Navigate" as const,
        keywords: ["home"],
        run: () => navigate("/dashboard"),
      },
      {
        id: "nav-roles",
        title: "Roles",
        subtitle: "Manage roles",
        shortcut: "G R",
        group: "Navigate" as const,
        run: () => navigate("/admin/roles"),
      },
      {
        id: "nav-permissions",
        title: "Permissions",
        subtitle: "Manage permissions",
        shortcut: "G P",
        group: "Navigate" as const,
        run: () => navigate("/admin/permissions"),
      },
      {
        id: "nav-requests",
        title: "Requests",
        subtitle: "Access requests inbox",
        shortcut: "G A",
        group: "Navigate" as const,
        run: () => navigate("/admin/requests"),
      },
      {
        id: "nav-audit",
        title: "Audit",
        subtitle: "View audit log",
        shortcut: "G L",
        group: "Navigate" as const,
        run: () => navigate("/admin/audit"),
      },

      // Actions
      {
        id: "act-theme",
        title: "Toggle theme",
        subtitle: resolvedTheme === "dark" ? "Switch to light" : "Switch to dark",
        shortcut: "T",
        group: "Actions" as const,
        keywords: ["dark", "light"],
        run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      },
      {
        id: "act-export-audit",
        title: "Export audit CSV",
        subtitle: "Download current audit rows",
        shortcut: "E",
        group: "Actions" as const,
        keywords: ["csv", "download"],
        run: () => exportAuditCsv(auditRows ?? []),
      },
    ];
  }, [navigate, resolvedTheme, setTheme, auditRows]);

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} onCommand={() => setCmdOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} commands={commands} />
    </div>
  );
}
