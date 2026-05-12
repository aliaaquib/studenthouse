import { BadgeCheck, GraduationCap, HeartHandshake, ShieldCheck } from "lucide-react";
import { PageChrome, PageIntro } from "@/components/sections/page-chrome";

const values = [
  {
    icon: ShieldCheck,
    title: "Student-safe listings",
    copy: "We focus on verified apartments, shared rooms, and student-friendly homes around Jalal-Abad universities."
  },
  {
    icon: BadgeCheck,
    title: "Clear rent and details",
    copy: "Prices, bills, furnished status, roommate preferences, and campus distance are shown before students contact a landlord."
  },
  {
    icon: HeartHandshake,
    title: "Local support",
    copy: "Students can message landlords through WhatsApp, request visits, and compare homes before moving in."
  }
];

export default function AboutPage() {
  return (
    <PageChrome>
      <PageIntro
        title="About StudentNest"
        copy="StudentNest helps university students in Jalal-Abad find safe, affordable, and verified student housing near campus."
      />
      <section className="section-frame grid gap-8 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] bg-[var(--surface)] p-7 sm:p-9">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white">
            <GraduationCap size={26} />
          </div>
          <h2 className="mt-7 max-w-[520px] text-[32px] font-bold leading-[1.16] tracking-[-0.01em] sm:text-[42px]">
            Built for students, not luxury real estate.
          </h2>
          <p className="mt-5 max-w-[560px] text-[15px] font-normal leading-[1.8] text-[var(--muted)]">
            We are launching with Jalal-Abad housing first, helping JAIU, JASU, and CAIMU students compare practical rentals, shared rooms, roommate-ready apartments, and verified landlords in one clean place.
          </p>
        </div>
        <div className="grid gap-4">
          {values.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
                <Icon className="text-[var(--primary)]" size={24} />
                <h3 className="mt-4 text-[20px] font-semibold leading-[1.3]">{item.title}</h3>
                <p className="mt-2 text-[14px] font-normal leading-[1.7] text-[var(--muted)]">{item.copy}</p>
              </article>
            );
          })}
        </div>
      </section>
    </PageChrome>
  );
}
