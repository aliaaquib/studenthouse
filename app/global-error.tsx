"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[var(--background)] text-[var(--foreground)]">
        <main className="figma-shell flex min-h-screen items-center justify-center px-6 py-16">
          <div className="w-full max-w-[560px] rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-[var(--shadow-card)]">
            <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--primary)]">StudentNest</p>
            <h1 className="mt-4 text-[32px] font-medium leading-[1.15]">Something went wrong</h1>
            <p className="mt-4 text-[15px] font-normal leading-[1.8] text-[var(--muted)]">
              We hit an unexpected issue while loading this page. Please try again. If the problem keeps happening, return to the homepage and retry the flow.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button type="button" onClick={() => reset()}>
                Try again
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Go home</Link>
              </Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
