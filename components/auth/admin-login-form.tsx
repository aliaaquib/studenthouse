"use client";

import { useActionState, useState, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginWithPassword, type LoginActionState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email("Enter a valid admin email"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

type LoginValues = z.infer<typeof schema>;

export function AdminLoginForm({ nextPath, message }: { nextPath: string; message?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState<LoginActionState, FormData>(loginWithPassword, {});
  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });

  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    const parsed = schema.safeParse(form.getValues());
    if (parsed.success) return;

    event.preventDefault();
    form.clearErrors();
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0];
      if (field === "email" || field === "password") {
        form.setError(field, { message: issue.message });
      }
    });
  }

  const errorMessage = Object.values(form.formState.errors)[0]?.message ?? state.error ?? message;

  return (
    <div className="w-full max-w-[480px] rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)] sm:p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)]">
        <LockKeyhole size={22} />
      </div>
      <p className="mt-6 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[var(--primary)]">Secure admin access</p>
      <h1 className="mt-2 text-[30px] font-semibold leading-[1.15]">Sign in to Admin CMS</h1>
      <p className="mt-3 text-[14px] font-semibold leading-[1.7] text-[var(--muted)]">
        Server-validated access for property, university, inquiry, and platform settings management.
      </p>

      <form className="mt-8 grid gap-4" action={formAction} onSubmit={validateBeforeSubmit}>
        <input type="hidden" name="next" value={nextPath} />
        <Input type="email" placeholder="Admin email" aria-label="Admin email" autoComplete="email" {...form.register("email")} />
        <label className="relative">
          <Input type={showPassword ? "text" : "password"} placeholder="Password" aria-label="Password" autoComplete="current-password" className="pr-12" {...form.register("password")} />
          <button
            type="button"
            className="focus-ring absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--primary)]"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </label>
        <label className="flex items-center gap-3 rounded-[14px] bg-[var(--surface)] px-4 py-3 text-[13px] font-extrabold text-[var(--muted-strong)]">
          <input name="remember" type="checkbox" className="h-4 w-4 accent-[var(--primary)]" />
          Remember this secure session for 7 days
        </label>
        <Button className="h-12 w-full" type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
          {pending ? "Checking access..." : "Sign in securely"}
        </Button>
      </form>

      <p className="mt-4 min-h-5 text-center text-[13px] font-semibold text-[var(--muted)]" aria-live="polite">
        {errorMessage}
      </p>
    </div>
  );
}
