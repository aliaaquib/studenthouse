export type AdminSession = {
  email: string;
  role: "admin";
  issuedAt: number;
  expiresAt: number;
};

export const ADMIN_SESSION_COOKIE = "studentnest_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;
export const ADMIN_REMEMBERED_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function base64UrlEncode(value: string) {
  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return atob(padded);
}

async function signPayload(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const bytes = Array.from(new Uint8Array(signature));
  return base64UrlEncode(String.fromCharCode(...bytes));
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}

export function getAdminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD ?? "";
}

export async function createAdminSessionCookie(email: string, maxAge = ADMIN_SESSION_MAX_AGE) {
  const now = Math.floor(Date.now() / 1000);
  const session: AdminSession = {
    email,
    role: "admin",
    issuedAt: now,
    expiresAt: now + maxAge
  };
  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = await signPayload(payload, getAdminSessionSecret());

  return `${payload}.${signature}`;
}

export async function verifyAdminSessionCookie(cookieValue?: string | null) {
  const secret = getAdminSessionSecret();
  if (!cookieValue || !secret) return null;

  const [payload, signature] = cookieValue.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = await signPayload(payload, secret);
  if (!constantTimeEqual(signature, expectedSignature)) return null;

  try {
    const session = JSON.parse(base64UrlDecode(payload)) as Partial<AdminSession>;
    const now = Math.floor(Date.now() / 1000);

    if (session.role !== "admin" || !session.email || !session.expiresAt || session.expiresAt <= now) {
      return null;
    }

    return session as AdminSession;
  } catch {
    return null;
  }
}
