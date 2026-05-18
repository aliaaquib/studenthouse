const globalStore = globalThis as typeof globalThis & {
  __studentNestRateLimitStore?: Map<string, { count: number; resetAt: number }>;
};

function getStore() {
  globalStore.__studentNestRateLimitStore ??= new Map();
  return globalStore.__studentNestRateLimitStore;
}

export function consumeRateLimit(key: string, { limit, windowMs }: { limit: number; windowMs: number }) {
  const store = getStore();
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: current.resetAt - now };
  }

  current.count += 1;
  store.set(key, current);
  return { ok: true, remaining: limit - current.count };
}
