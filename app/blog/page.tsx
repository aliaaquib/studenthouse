import Link from "next/link";
import { FileText } from "lucide-react";
import { PageChrome, PageIntro } from "@/components/sections/page-chrome";

const posts = [
  {
    title: "How to compare student apartments before the semester starts",
    copy: "A quick checklist for rent, utilities, commute, room type, and verified landlord details."
  },
  {
    title: "Shared room or private room: what works best for your budget?",
    copy: "A practical look at trade-offs between privacy, cost, and everyday student routines."
  },
  {
    title: "Questions to ask before booking housing near JAIU, JASU, or CAIMU",
    copy: "Use this before you message a landlord or request a visit."
  }
];

export default function BlogPage() {
  return (
    <PageChrome>
      <PageIntro
        title="StudentNest Blog"
        copy="Simple guides for students comparing apartments, shared rooms, budgets, and safer move-in decisions."
      />
      <section className="section-frame grid gap-4 py-12 md:grid-cols-3">
        {posts.map((post) => (
          <article key={post.title} className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
            <FileText className="text-[var(--primary)]" size={22} />
            <h2 className="mt-4 text-[20px] font-semibold leading-[1.3]">{post.title}</h2>
            <p className="mt-2 text-[14px] font-normal leading-[1.7] text-[var(--muted)]">{post.copy}</p>
            <Link href="/contact" className="mt-5 inline-flex text-[14px] font-medium text-[var(--primary)]">
              Ask our team about this
            </Link>
          </article>
        ))}
      </section>
    </PageChrome>
  );
}
