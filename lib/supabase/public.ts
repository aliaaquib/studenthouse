import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

let publicClient: SupabaseClient | null = null;

export function getSupabasePublicClient() {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;

  publicClient ??= createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return publicClient;
}
