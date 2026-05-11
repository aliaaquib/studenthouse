"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

const snapshotCache = new Map<string, { raw: string; value: unknown }>();

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("studentnest-storage", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("studentnest-storage", callback);
  };
}

function emitStorageChange() {
  window.dispatchEvent(new Event("studentnest-storage"));
}

export function useLocalStorageValue<T>(key: string, fallback: T) {
  const fallbackRef = useRef(fallback);

  const getSnapshot = useCallback(() => {
    const item = window.localStorage.getItem(key);
    if (!item) return fallbackRef.current;

    const cached = snapshotCache.get(key);
    if (cached?.raw === item) return cached.value as T;

    try {
      const parsed = JSON.parse(item) as T;
      snapshotCache.set(key, { raw: item, value: parsed });
      return parsed;
    } catch {
      return fallbackRef.current;
    }
  }, [key]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => fallbackRef.current);

  const setValue = useCallback((nextValue: T | ((current: T) => T)) => {
    const current = getSnapshot();
    const resolved = typeof nextValue === "function" ? (nextValue as (current: T) => T)(current) : nextValue;
    const raw = JSON.stringify(resolved);
    window.localStorage.setItem(key, raw);
    snapshotCache.set(key, { raw, value: resolved });
    emitStorageChange();
  }, [getSnapshot, key]);

  return [value, setValue] as const;
}
