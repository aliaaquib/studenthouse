export type AdminSession = {
  email: string;
  role: "admin";
  issuedAt: number;
  expiresAt: number;
};

export const ADMIN_SESSION_COOKIE = "studentnest_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;
export const ADMIN_REMEMBERED_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const base64Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function bytesToBase64(bytes: Uint8Array) {
  let output = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    const triplet = (first << 16) | ((second ?? 0) << 8) | (third ?? 0);

    output += base64Alphabet[(triplet >> 18) & 63];
    output += base64Alphabet[(triplet >> 12) & 63];
    output += index + 1 < bytes.length ? base64Alphabet[(triplet >> 6) & 63] : "=";
    output += index + 2 < bytes.length ? base64Alphabet[triplet & 63] : "=";
  }

  return output;
}

function base64ToBytes(value: string) {
  const clean = value.replaceAll("=", "");
  const bytes: number[] = [];

  for (let index = 0; index < clean.length; index += 4) {
    const first = base64Alphabet.indexOf(clean[index]);
    const second = base64Alphabet.indexOf(clean[index + 1]);
    const third = base64Alphabet.indexOf(clean[index + 2] ?? "A");
    const fourth = base64Alphabet.indexOf(clean[index + 3] ?? "A");
    const triplet = (first << 18) | (second << 12) | (third << 6) | fourth;

    bytes.push((triplet >> 16) & 255);
    if (index + 2 < clean.length) bytes.push((triplet >> 8) & 255);
    if (index + 3 < clean.length) bytes.push(triplet & 255);
  }

  return new Uint8Array(bytes);
}

function base64UrlEncode(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return bytesToBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return new TextDecoder().decode(base64ToBytes(padded));
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
  return base64UrlEncode(new Uint8Array(signature));
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
