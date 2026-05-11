import { ContactForm } from "@/components/sections/contact-form";
import { PageChrome, PageIntro } from "@/components/sections/page-chrome";
import { properties } from "@/lib/data";

export default function ContactPage() {
  return (
    <PageChrome>
      <PageIntro title="Contact a verified landlord" copy="Send a secure inquiry, book a visit, request a virtual tour, or ask about roommate preferences before applying." />
      <section className="section-frame grid gap-8 py-12 lg:grid-cols-[1fr_420px]">
        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          <h2 className="text-h2 max-w-[620px]">Tell us what student housing you need.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {["Verified landlords", "Virtual tours", "WhatsApp follow-up", "Roommate preferences"].map((item) => (
              <div key={item} className="rounded-[18px] bg-[var(--card)] p-5 text-[14px] font-extrabold shadow-[var(--shadow-card)]">{item}</div>
            ))}
          </div>
        </div>
        <ContactForm title={`Ask about ${properties[0].name}`} property={properties[0]} />
      </section>
    </PageChrome>
  );
}
