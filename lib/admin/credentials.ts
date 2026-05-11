export type AdminCredentialsStatus = {
  configured: boolean;
  missing: string[];
};

export function getAdminCredentialsStatus(): AdminCredentialsStatus {
  const missing = ([
    ["ADMIN_EMAIL", process.env.ADMIN_EMAIL],
    ["ADMIN_PASSWORD", process.env.ADMIN_PASSWORD]
  ] as const)
    .filter(([, value]) => !value)
    .map(([key]) => key) as string[];

  return {
    configured: missing.length === 0,
    missing
  };
}

function constantTimeEqual(left: string, right: string) {
  const maxLength = Math.max(left.length, right.length);
  let result = left.length ^ right.length;

  for (let index = 0; index < maxLength; index += 1) {
    result |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return result === 0;
}

export function validateAdminCredentials(email: string, password: string) {
  const expectedEmail = process.env.ADMIN_EMAIL ?? "";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";

  if (!expectedEmail || !expectedPassword) return false;

  return constantTimeEqual(email.trim().toLowerCase(), expectedEmail.trim().toLowerCase())
    && constantTimeEqual(password, expectedPassword);
}
