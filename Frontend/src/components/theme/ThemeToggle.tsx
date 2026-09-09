import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/context/ThemeContext";

import { iconButtonClass, menuItemClass } from "@/components/dashboard/panel";

export function ThemeMenuItem() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button type="button" role="menuitem" onClick={toggleTheme} className={menuItemClass}>
      {isDark ? (
        <Sun className="h-3.5 w-3.5" strokeWidth={1.6} />
      ) : (
        <Moon className="h-3.5 w-3.5" strokeWidth={1.6} />
      )}
      {isDark ? "Light theme" : "Dark theme"}
    </button>
  );
}

export function ThemeIconButton() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={iconButtonClass}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        <Sun className="h-4 w-4" strokeWidth={1.6} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={1.6} />
      )}
    </button>
  );
}
