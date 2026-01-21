import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light" | "system";

interface ThemeState {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      resolvedTheme: "dark",
      setTheme: (theme) => {
        const resolved =
          theme === "system"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light"
            : theme;

        document.documentElement.classList.toggle("light", resolved === "light");
        set({ theme, resolvedTheme: resolved });
      },
    }),
    { name: "authz-theme" }
  )
);
