"use client";

import { useAdminSettingsContext } from "@/components/providers/admin-settings-provider";

export function useAdminSettings() {
  return useAdminSettingsContext();
}
