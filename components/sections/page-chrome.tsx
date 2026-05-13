import type { ReactNode } from "react";
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";

export function PageChrome({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`figma-shell min-h-screen ${className}`.trim()}>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export function PageIntro({ title, copy }: { title: string; copy: string }) {
  return (
    <section className="bg-[var(--surface)] py-14 sm:py-18">
      <div className="section-frame">
        <h1 className="text-h2 max-w-[720px]">{title}</h1>
        <p className="mt-4 max-w-[640px] text-[15px] font-normal leading-[1.7] text-[var(--muted)]">{copy}</p>
      </div>
    </section>
  );
}
