import { Home, ShieldCheck } from "lucide-react";
import { AddPropertyForm } from "@/components/sections/add-property-form";
import { PageChrome, PageIntro } from "@/components/sections/page-chrome";

export default function AddPropertyPage() {
  return (
    <PageChrome>
      <PageIntro
        title="Add your student property"
        copy="List a verified apartment, shared room, or student-friendly rental for university students in Jalal-Abad."
      />
      <section className="section-frame grid gap-8 py-12 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-[28px] bg-[var(--surface)] p-7 sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white">
            <Home size={25} />
          </div>
          <h2 className="mt-7 text-[30px] font-bold leading-[1.16] tracking-[-0.01em]">Reach students looking for verified housing.</h2>
          <div className="mt-7 grid gap-4 text-[14px] font-normal leading-[1.7] text-[var(--muted)]">
            <p>Submit your property details and our team will review the listing before it goes live.</p>
            <p className="flex items-center gap-2 text-[var(--muted-strong)]"><ShieldCheck size={18} color="var(--primary)" /> Verified listings build trust with students and parents.</p>
          </div>
        </aside>
        <AddPropertyForm />
      </section>
    </PageChrome>
  );
}
