import { BadgeCheck, CalendarCheck, Home, MessageCircle, Search, ShieldCheck } from "lucide-react";

const stats = [
  { icon: Search, value: "1", label: "Search apartments" },
  { icon: BadgeCheck, value: "2", label: "Explore verified listings" },
  { icon: MessageCircle, value: "3", label: "Contact landlord" },
  { icon: CalendarCheck, value: "4", label: "Book visit or virtual tour" },
  { icon: Home, value: "5", label: "Move into your student home" }
];

export function Benefit() {
  return (
    <section className="bg-[var(--background)] py-16 sm:py-20">
      <div className="section-frame overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)]">
        <div className="grid gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[420px_1fr] lg:px-12 lg:py-12">
          <div>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-white dark:text-[#071411]">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-h2 max-w-[430px] text-[var(--secondary)]">How StudentNest keeps housing simple and safe.</h2>
            <p className="mt-4 max-w-[390px] text-[15px] font-semibold leading-[1.75] text-[var(--muted)]">
              A clean five-step flow from search to move-in, with verified landlords, secure communication, and student-focused support.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)]">
                    <Icon size={22} />
                  </span>
                  <strong className="mt-5 block text-[24px] font-extrabold leading-[1.1] text-[var(--primary)]">{item.value}</strong>
                  <span className="mt-2 block text-[13px] font-extrabold leading-[1.45] text-[var(--muted-strong)]">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
