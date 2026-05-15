import { BriefcaseBusiness, Sparkles, Users } from "lucide-react";
import { PageChrome, PageIntro } from "@/components/sections/page-chrome";

const roles = [
  {
    icon: Users,
    title: "Student success",
    copy: "Help students compare housing options, understand listings, and move into better shared and private rooms."
  },
  {
    icon: BriefcaseBusiness,
    title: "Partnerships",
    copy: "Work with landlords, universities, and local operators to grow verified student housing inventory."
  },
  {
    icon: Sparkles,
    title: "Product and operations",
    copy: "Improve the experience that makes student housing discovery simpler, safer, and faster."
  }
];

export default function CareersPage() {
  return (
    <PageChrome>
      <PageIntro
        title="Careers at StudentNest"
        copy="We’re building a calmer, clearer housing experience for students in Kyrgyzstan, starting with Jalal-Abad."
      />
      <section className="section-frame grid gap-8 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] bg-[var(--surface)] p-7 sm:p-9">
          <h2 className="text-[32px] font-medium leading-[1.16] tracking-[-0.01em] sm:text-[42px]">
            We’re not hiring publicly yet, but we’re growing toward it.
          </h2>
          <p className="mt-5 max-w-[560px] text-[15px] font-normal leading-[1.8] text-[var(--muted)]">
            If you care about student housing, marketplace trust, local partnerships, or polished product experiences, reach out through our contact page and tell us how you could help.
          </p>
        </div>
        <div className="grid gap-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <article key={role.title} className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
                <Icon className="text-[var(--primary)]" size={24} />
                <h3 className="mt-4 text-[20px] font-semibold leading-[1.3]">{role.title}</h3>
                <p className="mt-2 text-[14px] font-normal leading-[1.7] text-[var(--muted)]">{role.copy}</p>
              </article>
            );
          })}
        </div>
      </section>
    </PageChrome>
  );
}
