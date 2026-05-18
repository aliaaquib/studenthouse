"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canAccessAdmin, canAccessAgentDashboard, type AppRole } from "@/lib/rbac";
import { publicErrorMessage, safeRedirectPath, sanitizeSingleLineText } from "@/lib/security";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Mode = "login" | "signup";

async function getUserRole(supabase: NonNullable<ReturnType<typeof createSupabaseBrowserClient>>, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return (profile?.role as AppRole | undefined) ?? "student";
}

export function AuthForm({
  mode,
  nextPath,
  message
}: {
  mode: Mode;
  nextPath: string;
  message?: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const safeNextPath = safeRedirectPath(nextPath, "/dashboard");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(message ?? "");

  async function handleSubmit(formData: FormData) {
    if (!supabase) {
      setError("Supabase auth is not configured.");
      return;
    }

    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const fullName = sanitizeSingleLineText(String(formData.get("fullName") ?? ""), 80);

    if (!email || !password || (mode === "signup" && password.length < 8)) {
      setError(mode === "signup" ? "Use a valid email and a password with at least 8 characters." : "Use a valid email and password.");
      return;
    }

    setPending(true);
    setError("");

    try {
      if (mode === "signup") {
        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || undefined
            }
          }
        });

        if (signUpError) {
          setError(publicErrorMessage(signUpError, "Unable to create your account right now."));
          return;
        }

        if (data.session) {
          router.replace(safeNextPath);
          router.refresh();
          return;
        }

        router.replace("/login?mode=login");
        return;
      }

      const { error: signInError, data } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(publicErrorMessage(signInError, "Unable to sign in with those credentials."));
        return;
      }

      const role = await getUserRole(supabase, data.user.id);

      if (safeNextPath.startsWith("/admin") && !canAccessAdmin(role)) {
        setError("This account does not have admin access.");
        await supabase.auth.signOut();
        return;
      }

      if (safeNextPath.startsWith("/agent") && !canAccessAgentDashboard(role)) {
        setError("This account does not have agent access.");
        await supabase.auth.signOut();
        return;
      }

      router.replace(safeNextPath);
      router.refresh();
    } catch (error) {
      setError(publicErrorMessage(error, "Unable to complete authentication right now."));
    } finally {
      setPending(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!supabase) {
      setError("Supabase auth is not configured.");
      return;
    }

    setPending(true);
    const redirectTo = typeof window !== "undefined"
      ? `${window.location.origin}${safeNextPath}`
      : undefined;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo }
    });

    if (oauthError) {
      setError(publicErrorMessage(oauthError, "Unable to continue with Google right now."));
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-[480px] rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)] sm:p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)]">
        <LockKeyhole size={22} />
      </div>
      <p className="mt-6 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[var(--primary)]">
        {mode === "login" ? "Secure account access" : "Create your student account"}
      </p>
      <h1 className="mt-2 text-[30px] font-semibold leading-[1.15]">
        {mode === "login" ? "Sign in to StudentNest" : "Join StudentNest"}
      </h1>
      <p className="mt-3 text-[14px] font-semibold leading-[1.7] text-[var(--muted)]">
        {mode === "login"
          ? "Use your account to save apartments, message landlords, and manage your student housing dashboard."
          : "Create an account to save apartments, track inquiries, and keep your student housing shortlist synced."}
      </p>

      <form className="mt-8 grid gap-4" action={handleSubmit}>
        {mode === "signup" ? (
          <Input name="fullName" placeholder="Full name" aria-label="Full name" autoComplete="name" required />
        ) : null}
        <Input name="email" type="email" placeholder="Email address" aria-label="Email address" autoComplete="email" required />
        <label className="relative">
          <Input name="password" type={showPassword ? "text" : "password"} placeholder="Password" aria-label="Password" autoComplete={mode === "login" ? "current-password" : "new-password"} className="pr-12" required />
          <button
            type="button"
            className="focus-ring absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--primary)]"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </label>
        <Button className="h-12 w-full" type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <Button className="mt-3 h-12 w-full" type="button" variant="outline" onClick={handleGoogleSignIn} disabled={pending}>
        Continue with Google
      </Button>

      <p className="mt-4 min-h-5 text-center text-[13px] font-semibold text-[var(--muted)]" aria-live="polite">
        {error}
      </p>

      <p className="mt-4 text-center text-[13px] font-medium text-[var(--muted)]">
        {mode === "login" ? "New here?" : "Already have an account?"}{" "}
        <Link href={mode === "login" ? `/login?mode=signup&next=${encodeURIComponent(safeNextPath)}` : `/login?mode=login&next=${encodeURIComponent(safeNextPath)}`} className="text-[var(--primary)]">
          {mode === "login" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
