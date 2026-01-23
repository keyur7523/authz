import { Menu, Sun, Moon, LogOut, Building2 } from "lucide-react";
import { useThemeStore } from "../stores/themeStore";
import { useAuthStore } from "../stores/authStore";
import { useState } from "react";

export function Topbar({ onMenuClick, onCommand }: { onMenuClick: () => void; onCommand: () => void }) {
  const { resolvedTheme, setTheme } = useThemeStore();
  const { user, currentOrgId, setCurrentOrg, logout } = useAuthStore();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  const currentOrg = user?.organizations.find((o) => o.id === currentOrgId);

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

        {/* Org Selector */}
        {user && user.organizations.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="flex items-center gap-2 rounded px-3 py-1.5 text-sm hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)]"
            >
              <Building2 className="h-4 w-4" />
              <span>{currentOrg?.name || "Select Org"}</span>
            </button>

            {showOrgDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
                {user.organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      setCurrentOrg(org.id);
                      setShowOrgDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-surface-hover)] ${
                      org.id === currentOrgId ? "bg-[var(--color-surface-hover)]" : ""
                    }`}
                  >
                    <div className="font-medium">{org.name}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {org.role}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
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

        {/* User info and logout */}
        {user && (
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-secondary)] hidden sm:inline">
              {user.email}
            </span>
            <button
              onClick={logout}
              className="rounded p-2 hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
