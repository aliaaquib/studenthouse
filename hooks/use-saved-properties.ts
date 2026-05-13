"use client";

import { useSavedPropertiesContext } from "@/components/providers/saved-properties-provider";

export function useSavedProperties() {
  return useSavedPropertiesContext();
}
