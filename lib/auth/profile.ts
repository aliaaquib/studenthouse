import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveDefaultRoleForEmail, type AppRole } from "@/lib/rbac";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
};

export async function ensureProfileRole(user: User, profile?: ProfileRow | null) {
  const desiredRole = resolveDefaultRoleForEmail(user.email);
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) return profile ?? null;

  if (!profile) {
    const { data } = await adminClient
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
        role: desiredRole
      })
      .select("id, email, full_name, role")
      .single();

    return (data as ProfileRow | null) ?? null;
  }

  if (desiredRole === "admin" && profile.role !== "admin") {
    const { data } = await adminClient
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", user.id)
      .select("id, email, full_name, role")
      .single();

    return (data as ProfileRow | null) ?? { ...profile, role: "admin" };
  }

  return profile;
}

export async function getProfileForUser(
  supabase: SupabaseClient,
  user: User
) {
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return ensureProfileRole(user, (data as ProfileRow | null) ?? null);
}
