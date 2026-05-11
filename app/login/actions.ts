"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminCredentialsStatus, validateAdminCredentials } from "@/lib/admin/credentials";
import {
  ADMIN_REMEMBERED_SESSION_MAX_AGE,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionCookie
} from "@/lib/session/admin-session";

export type LoginActionState = {
  error?: string;
};

const loginSchema = z.object({
  email: z.string().email("Enter a valid admin email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.string().optional(),
  next: z.string().optional()
});

function safeAdminNext(value?: string | null) {
  if (!value) return "/admin/dashboard";
  return value.startsWith("/admin") ? value : "/admin/dashboard";
}

export async function loginWithPassword(_previousState: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const credentialsStatus = getAdminCredentialsStatus();
  if (!credentialsStatus.configured) {
    return { error: `Admin auth is missing ${credentialsStatus.missing.join(", ")} in the environment.` };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    remember: formData.get("remember"),
    next: formData.get("next")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter valid login details." };
  }

  if (!validateAdminCredentials(parsed.data.email, parsed.data.password)) {
    return { error: "Invalid admin email or password." };
  }

  const maxAge = parsed.data.remember === "on" ? ADMIN_REMEMBERED_SESSION_MAX_AGE : ADMIN_SESSION_MAX_AGE;
  const cookieValue = await createAdminSessionCookie(parsed.data.email.trim().toLowerCase(), maxAge);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge
  });

  redirect(safeAdminNext(parsed.data.next));
}
