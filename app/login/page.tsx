import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { safeRedirectPath } from "@/lib/security";

export const metadata: Metadata = {
  title: "Login | StudentNest",
  robots: {
    index: false,
    follow: false
  }
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const nextPath = safeRedirectPath(readParam(params?.next), "/dashboard");
  const error = readParam(params?.error);
  const mode = readParam(params?.mode) === "signup" ? "signup" : "login";
  const message = error === "expired" ? "Your session expired. Please sign in again." : undefined;

  return (
    <main className="figma-shell min-h-screen bg-[var(--background)]">
      <section className="grid min-h-screen place-items-center px-4 py-12">
        <AuthForm
          mode={mode}
          nextPath={nextPath}
          message={message}
        />
      </section>
    </main>
  );
}
