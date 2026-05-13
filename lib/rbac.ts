export type AppRole = "admin" | "agent" | "student";

export type RoleSession = {
  id: string;
  email: string;
  role: AppRole;
};

function parseEmailList(value?: string) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

export const ADMIN_EMAILS = parseEmailList(
  [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL].filter(Boolean).join(",")
);

export function resolveDefaultRoleForEmail(email?: string | null): AppRole {
  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail && ADMIN_EMAILS.has(normalizedEmail)) return "admin";
  return "student";
}

export function isAdmin(role?: AppRole | null): role is "admin" {
  return role === "admin";
}

export function isAgent(role?: AppRole | null): role is "agent" {
  return role === "agent";
}

export function isStudent(role?: AppRole | null): role is "student" {
  return role === "student";
}

export function canCreateProperty(role?: AppRole | null) {
  return role === "admin" || role === "agent";
}

export function canEditProperty(session: Pick<RoleSession, "id" | "role"> | null | undefined, createdBy?: string | null) {
  if (!session) return false;
  if (session.role === "admin") return true;
  return session.role === "agent" && Boolean(createdBy) && createdBy === session.id;
}

export function canDeleteProperty(session: Pick<RoleSession, "role"> | null | undefined) {
  return session?.role === "admin";
}

export function canAccessAdmin(role?: AppRole | null) {
  return role === "admin";
}

export function canAccessAgentDashboard(role?: AppRole | null) {
  return role === "admin" || role === "agent";
}
