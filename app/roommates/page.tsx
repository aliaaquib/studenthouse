import Link from "next/link";
import { HeartHandshake, ShieldCheck, Users } from "lucide-react";
import { PageChrome, PageIntro } from "@/components/sections/page-chrome";

const tips = [
  {
    icon: Users,
    title: "Match by routine",
    copy: "Compare study schedules, quiet hours, cleanliness habits, and move-in timing before sharing a room."
  },
  {
    icon: ShieldCheck,
    title: "Choose verified listings",
    copy: "Use verified student housing so both roommates know the address, rent, and included bills upfront."
  },
  {
    icon: HeartHandshake,
    title: "Start with shared-room options",
    copy: "Browse shared rooms near JAIU, JASU, and CAIMU to find lower-cost housing with student-friendly setups."
  }
];

export default function RoommatesPage() {
  return (
    <PageChrome>
      <PageIntro
        title="Find a better roommate setup"
        copy="Use StudentNest to compare shared student homes, talk through expectations early, and shortlist places that fit your budget and routine."
      />
      <section className="section-frame grid gap-8 py-12 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] bg-[var(--surface)] p-7 sm:p-9">
          <h2 className="text-[32px] font-medium leading-[1.16] tracking-[-0.01em] sm:text-[42px]">
            Shared housing works better when the basics are clear.
          </h2>
          <p className="mt-5 max-w-[560px] text-[15px] font-normal leading-[1.8] text-[var(--muted)]">
            We recommend starting with verified shared-room listings, then using viewing requests and WhatsApp to confirm rent split, guest rules, utilities, and study-time expectations.
          </p>
          <Link href="/shared-rooms" className="mt-6 inline-flex text-[15px] font-medium text-[var(--primary)]">
            View shared rooms
          </Link>
        </div>
        <div className="grid gap-4">
          {tips.map((item) => {
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
