"use client";

import { useCallback, useSyncExternalStore } from "react";

const THEME_KEY = "studentnest-theme";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("studentnest-theme", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("studentnest-theme", callback);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(THEME_KEY) === "dark";
}

export function useTheme() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const toggleTheme = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    window.dispatchEvent(new Event("studentnest-theme"));
  }, []);

  return { isDark, toggleTheme };
}
