import { Shield, ShieldCheck, UserCheck } from "lucide-react";
import { PageChrome, PageIntro } from "@/components/sections/page-chrome";

const tips = [
  {
    icon: ShieldCheck,
    title: "Use verified listings first",
    copy: "Start with listings that clearly show rent, room type, utility status, and nearby campus details."
  },
  {
    icon: UserCheck,
    title: "Confirm details before paying",
    copy: "Ask about monthly rent, deposit, roommate count, move-in date, and what is included before making any transfer."
  },
  {
    icon: Shield,
    title: "Meet or video tour when possible",
    copy: "If you are moving from another city or country, use virtual tours and WhatsApp questions before committing."
  }
];

export default function SafetyTipsPage() {
  return (
    <PageChrome>
      <PageIntro
        title="Student housing safety tips"
        copy="A few simple checks can make shared rooms, private rooms, and student apartments much safer to compare before move-in."
      />
      <section className="section-frame grid gap-4 py-12 md:grid-cols-3">
        {tips.map((tip) => {
          const Icon = tip.icon;
          return (
            <article key={tip.title} className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
              <Icon className="text-[var(--primary)]" size={24} />
              <h2 className="mt-4 text-[20px] font-semibold leading-[1.3]">{tip.title}</h2>
              <p className="mt-2 text-[14px] font-normal leading-[1.7] text-[var(--muted)]">{tip.copy}</p>
            </article>
          );
        })}
      </section>
    </PageChrome>
  );
}
