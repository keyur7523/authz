import { useEffect } from "react";
import { useThemeStore } from "./stores/themeStore";

export function App() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  return <div className="min-h-screen">App</div>;
}
