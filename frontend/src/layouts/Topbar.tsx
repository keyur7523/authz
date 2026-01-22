import { Menu, Sun, Moon } from "lucide-react";
import { useThemeStore } from "../stores/themeStore";

export function Topbar({ onMenuClick, onCommand }: { onMenuClick: () => void; onCommand: () => void }) {
  const { resolvedTheme, setTheme } = useThemeStore();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <div className="flex items-center gap-2">
        <button
          className="rounded p-2 hover:bg-[var(--color-surface-hover)] md:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="text-sm font-semibold">Dashboard</div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onCommand}
          className="hidden sm:inline rounded px-3 py-2 text-xs border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
        >
          Cmd/Ctrl + K
        </button>
        <button
          className="rounded p-2 hover:bg-[var(--color-surface-hover)]"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
}
