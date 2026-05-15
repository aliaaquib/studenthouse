import { BookOpen, CircleHelp, MessageCircleMore } from "lucide-react";
import { PageChrome, PageIntro } from "@/components/sections/page-chrome";

const helpTopics = [
  {
    icon: CircleHelp,
    title: "How booking requests work",
    copy: "Students can save listings, send inquiries, and open WhatsApp contact with the correct apartment details already filled in."
  },
  {
    icon: BookOpen,
    title: "What verified means",
    copy: "Verified listings have clearer rent details, student-friendly information, and landlord review before being shown publicly."
  },
  {
    icon: MessageCircleMore,
    title: "Need direct support?",
    copy: "If you need help comparing listings or understanding shared-room expectations, use the contact page and our team can guide you."
  }
];

export default function HelpCenterPage() {
  return (
    <PageChrome>
      <PageIntro
        title="Help Center"
        copy="Everything students need to understand how StudentNest works, from browsing apartments to contacting landlords and comparing verified housing."
      />
      <section className="section-frame grid gap-4 py-12 md:grid-cols-3">
        {helpTopics.map((topic) => {
          const Icon = topic.icon;
          return (
            <article key={topic.title} className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
              <Icon className="text-[var(--primary)]" size={24} />
              <h2 className="mt-4 text-[20px] font-semibold leading-[1.3]">{topic.title}</h2>
              <p className="mt-2 text-[14px] font-normal leading-[1.7] text-[var(--muted)]">{topic.copy}</p>
            </article>
          );
        })}
      </section>
    </PageChrome>
  );
}
