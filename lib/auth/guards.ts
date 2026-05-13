import { redirect } from "next/navigation";
import { getProfileForUser } from "@/lib/auth/profile";
import { canAccessAdmin, canAccessAgentDashboard, type AppRole } from "@/lib/rbac";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppUserSession = {
  id: string;
  email: string;
  role: AppRole;
  fullName: string | null;
};

export async function getCurrentSession(): Promise<AppUserSession | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) return null;

  const profile = await getProfileForUser(supabase, user);

  return {
    id: user.id,
    email: user.email,
    role: profile?.role ?? "student",
    fullName: profile?.full_name ?? null
  };
}

export async function requireUser(next = "/dashboard") {
  const session = await getCurrentSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  return session;
}

export async function requireAdmin(next = "/admin/dashboard") {
  const session = await requireUser(next);
  if (!canAccessAdmin(session.role)) {
    redirect("/");
  }
  return session;
}

export async function requireAgent(next = "/agent") {
  const session = await requireUser(next);
  if (!canAccessAgentDashboard(session.role)) {
    redirect("/");
  }
  return session;
}
