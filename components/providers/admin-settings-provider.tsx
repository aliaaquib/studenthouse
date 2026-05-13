"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AdminSettings } from "@/lib/admin-settings";
import { normalizeWhatsAppPhone } from "@/lib/property-utils";

type AdminSettingsContextValue = {
  settings: AdminSettings;
  whatsAppPhone: string;
};

const AdminSettingsContext = createContext<AdminSettingsContextValue | null>(null);

export function AdminSettingsProvider({
  settings,
  children
}: {
  settings: AdminSettings;
  children: ReactNode;
}) {
  return (
    <AdminSettingsContext.Provider
      value={{
        settings,
        whatsAppPhone: normalizeWhatsAppPhone(settings.whatsApp)
      }}
    >
      {children}
    </AdminSettingsContext.Provider>
  );
}

export function useAdminSettingsContext() {
  const context = useContext(AdminSettingsContext);
  if (!context) {
    throw new Error("useAdminSettingsContext must be used within AdminSettingsProvider");
  }

  return context;
}
