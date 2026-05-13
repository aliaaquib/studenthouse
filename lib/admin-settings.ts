import { WHATSAPP_PHONE } from "@/lib/property-utils";

export type AdminSettings = {
  whatsApp: string;
  brand: string;
  currency: "KGS";
  homepage: string;
};

export const ADMIN_SETTINGS_KEY = "studentnest-admin-settings";

export const defaultAdminSettings: AdminSettings = {
  whatsApp: `+${WHATSAPP_PHONE}`,
  brand: "StudentNest",
  currency: "KGS",
  homepage: "Safe, affordable student housing near your university."
};

export function mapPlatformSettingsRow(
  row?: {
    whatsapp_number?: string | null;
    brand?: string | null;
    currency?: string | null;
    homepage_text?: string | null;
  } | null
): AdminSettings {
  return {
    whatsApp: row?.whatsapp_number ?? defaultAdminSettings.whatsApp,
    brand: row?.brand ?? defaultAdminSettings.brand,
    currency: "KGS",
    homepage: row?.homepage_text ?? defaultAdminSettings.homepage
  };
}
