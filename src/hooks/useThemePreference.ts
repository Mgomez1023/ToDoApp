import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "pulse-board-theme";

function getStoredTheme() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return null;
}

function getInitialTheme(): ThemeMode {
  const storedTheme = getStoredTheme();

  if (storedTheme) {
    return storedTheme;
  }

  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

export function useThemePreference() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const isFirstApplicationRef = useRef(true);
  const transitionTimeoutRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const shouldAnimate = !isFirstApplicationRef.current;

    if (shouldAnimate) {
      root.classList.add("theme-transitioning");

      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    }

    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    if (shouldAnimate) {
      transitionTimeoutRef.current = window.setTimeout(() => {
        root.classList.remove("theme-transitioning");
        transitionTimeoutRef.current = null;
      }, 520);
    }

    isFirstApplicationRef.current = false;
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }

      document.documentElement.classList.remove("theme-transitioning");
    };
  }, []);

  return {
    setTheme,
    theme,
  };
}
