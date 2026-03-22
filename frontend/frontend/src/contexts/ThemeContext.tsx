import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("authhub_theme") as Theme) || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    localStorage.setItem("authhub_theme", theme);

    const applyTheme = () => {
      let isDark = true;
      if (theme === "system") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      } else {
        isDark = theme === "dark";
      }

      setResolvedTheme(isDark ? "dark" : "light");

      if (isDark) {
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.add("light");
      }
    };

    applyTheme();

    // Listen to system changes if we are on 'system' mode
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const changeHandler = () => applyTheme();
      mediaQuery.addEventListener("change", changeHandler);
      return () => mediaQuery.removeEventListener("change", changeHandler);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
