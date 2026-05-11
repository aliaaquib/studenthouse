import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionCookie } from "@/lib/session/admin-session";

export type AdminSession = {
  email: string;
  role: "admin";
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const session = await verifyAdminSessionCookie(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  return session ? { email: session.email, role: "admin" } : null;
}

export async function requireAdmin(next = "/admin/dashboard") {
  const session = await getAdminSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  return session;
}
