"use client";

import { useMemo } from "react";
import { useLocalStorageValue } from "@/hooks/use-local-storage";

const SAVED_KEY = "studentnest-saved-properties";
const EMPTY_SAVED: string[] = [];

export function useSavedProperties() {
  const [savedIds, setSavedIds] = useLocalStorageValue<string[]>(SAVED_KEY, EMPTY_SAVED);
  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);

  function toggleSaved(id: string) {
    setSavedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return {
    savedIds,
    savedSet,
    isSaved: (id: string) => savedSet.has(id),
    toggleSaved
  };
}
