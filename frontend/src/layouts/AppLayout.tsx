import { Outlet } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandHelpModal } from "../modals/CommandHelpModal";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useHotkeys("mod+k", (e) => {
    e.preventDefault();
    setHelpOpen(true);
  });

  useHotkeys("esc", () => setHelpOpen(false));

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      <CommandHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
