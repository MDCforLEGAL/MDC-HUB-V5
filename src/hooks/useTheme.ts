import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";

const THEME_KEY = "mdc-hub.theme";
const THEME_COLORS: Record<Theme, string> = {
  dark: "#04060a",
  light: "#eef4fa",
};

function readTheme(): Theme {
  if (typeof document !== "undefined" && document.documentElement.dataset.theme === "light") {
    return "light";
  }

  try {
    return window.localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Private browsing can block storage; the theme still applies this visit.
    }

    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_COLORS[theme]);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}
