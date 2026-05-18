export const THEME_COOKIE_SCRIPT = "try{if(document.cookie.split('; ').find(function(item){return item.indexOf('studentnest-theme=')===0;})?.split('=')[1]==='dark'){document.documentElement.classList.add('dark')}}catch(e){}";

export function safeRedirectPath(value?: string | null, fallback = "/dashboard") {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("\r") || value.includes("\n")) return fallback;
  return value;
}

export function sanitizeSingleLineText(value: string, maxLength = 160) {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeMultilineText(value: string, maxLength = 2000) {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

export function isTrustedOrigin(headers: Pick<Headers, "get">, allowMissing = true) {
  const origin = headers.get("origin");
  const referer = headers.get("referer");
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const proto = headers.get("x-forwarded-proto") ?? "https";

  if (!host) return allowMissing;

  const expectedOrigin = `${proto}://${host}`;

  if (origin) {
    return origin === expectedOrigin;
  }

  if (referer) {
    try {
      return new URL(referer).origin === expectedOrigin;
    } catch {
      return false;
    }
  }

  return allowMissing;
}

export function publicErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof Error && error.message) {
    const message = sanitizeSingleLineText(error.message, 180);
    const lowered = message.toLowerCase();
    const safeFragments = [
      "invalid login credentials",
      "email not confirmed",
      "too many requests",
      "already registered",
      "password",
      "unauthorized",
      "forbidden",
      "not found"
    ];

    if (safeFragments.some((fragment) => lowered.includes(fragment))) {
      return message;
    }
  }
  return fallback;
}
