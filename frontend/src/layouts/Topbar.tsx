import { Menu, Sun, Moon } from "lucide-react";
import { useThemeStore } from "../stores/themeStore";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { resolvedTheme, setTheme } = useThemeStore();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <div className="flex items-center gap-2">
        <button
          className="rounded p-2 hover:bg-[var(--color-surface-hover)] md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="text-sm font-semibold">Dashboard</div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-xs text-[var(--color-text-muted)]">
          Cmd/Ctrl + K
        </span>
        <button
          className="rounded p-2 hover:bg-[var(--color-surface-hover)]"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
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
