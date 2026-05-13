import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppUserSession = {
  id: string;
  email: string;
  role: "admin" | "student";
  fullName: string | null;
};

export async function getCurrentSession(): Promise<AppUserSession | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email,
    role: (profile?.role as "admin" | "student" | undefined) ?? "student",
    fullName: (profile?.full_name as string | null | undefined) ?? null
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
  if (session.role !== "admin") {
    redirect("/");
  }
  return session;
}
