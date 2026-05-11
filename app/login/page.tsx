import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata: Metadata = {
  title: "Admin Login | StudentNest",
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
  const nextPath = readParam(params?.next) ?? "/admin/dashboard";
  const error = readParam(params?.error);
  const message = error === "expired" ? "Your admin session expired. Please sign in again." : undefined;

  return (
    <main className="figma-shell min-h-screen bg-[var(--background)]">
      <section className="grid min-h-screen place-items-center px-4 py-12">
        <AdminLoginForm nextPath={nextPath.startsWith("/admin") ? nextPath : "/admin/dashboard"} message={message} />
      </section>
    </main>
  );
}
