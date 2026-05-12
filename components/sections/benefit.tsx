"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarCheck, FileText, Home, MessageCircle, Search, ShieldCheck } from "lucide-react";
import { useRef } from "react";
import { assets } from "@/lib/assets";

const stats = [
  { icon: Search, value: "1", label: "Search apartments", image: assets.heroHome },
  { icon: BadgeCheck, value: "2", label: "Explore verified listings", image: assets.property1 },
  { icon: MessageCircle, value: "3", label: "Contact landlord", image: assets.heroSmallAlt },
  { icon: CalendarCheck, value: "4", label: "Book visit or virtual tour", image: assets.tenantHome },
  { icon: Home, value: "5", label: "Move into your student home", image: assets.property4 }
];

const mobileSteps = [
  {
    icon: Search,
    step: "Step 1",
    title: "Explore your city",
    description: "Discover housing options around Jalal-Abad as you plan for life at college."
  },
  {
    icon: BadgeCheck,
    step: "Step 2",
    title: "Compare verified rooms",
    description: "Review safe listings with clear prices, photos, amenities, and campus distance."
  },
  {
    icon: FileText,
    step: "Step 3",
    title: "Shortlist your favorites",
    description: "Save apartments you like and compare room type, bills, furniture, and roommates."
  },
  {
    icon: MessageCircle,
    step: "Step 4",
    title: "Contact the landlord",
    description: "Message trusted landlords directly on WhatsApp and ask questions before visiting."
  },
  {
    icon: CalendarCheck,
    step: "Step 5",
    title: "Book a visit",
    description: "Schedule an in-person visit or virtual tour before confirming your student home."
  },
  {
    icon: Home,
    step: "Step 6",
    title: "Move in with confidence",
    description: "Arrive prepared with a verified place close to your university and daily essentials."
  }
];

export function Benefit() {
  const mobileStepRefs = useRef<Array<HTMLElement | null>>([]);

  function scrollToStep(index: number) {
    mobileStepRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start"
    });
  }

  return (
    <section className="bg-[var(--background)] py-16 sm:py-20">
      <div className="section-frame md:hidden">
        <div className="rounded-[28px] bg-[#fff68f] px-5 py-7 text-[#202328]">
          <h2 className="text-[28px] font-bold leading-[1.12] tracking-[-0.01em]">
            How to rent your
            <br />
            <span className="text-[#7564f4]">first house</span>
          </h2>
          <div className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2">
            {mobileSteps.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.step}
                  ref={(node) => {
                    mobileStepRefs.current[index] = node;
                  }}
                  className="flex min-h-[305px] w-full shrink-0 snap-start flex-col"
                >
                  <div>
                    <Icon className="text-[#7564f4]" size={34} strokeWidth={1.8} />
                    <p className="mt-4 text-[22px] font-semibold leading-none text-[#7564f4]">{item.step}</p>
                  </div>
                  <h3 className="mt-7 max-w-[230px] text-[25px] font-medium leading-[1.16] tracking-[-0.01em]">{item.title}</h3>
                  <p className="mt-4 max-w-[270px] text-[15px] font-normal leading-[1.5] text-[#2e3038]">{item.description}</p>
                  <div className="mt-7 flex justify-center gap-3">
                    {mobileSteps.slice(0, 6).map((dot, dotIndex) => (
                      <button
                        key={dot.step}
                        type="button"
                        className={`focus-ring rounded-full transition ${dotIndex === index ? "h-2 w-8 bg-[#7564f4]" : "h-2 w-2 border border-[#7564f4]"}`}
                        aria-label={`Go to ${dot.step}`}
                        onClick={() => scrollToStep(dotIndex)}
                      />
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
          <Link href="/properties" className="focus-ring mt-6 flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 text-[15px] font-semibold text-white shadow-[0_12px_28px_rgba(23,166,115,0.22)] transition hover:bg-[var(--primary-light)]">
            Start Now <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      <div className="section-frame hidden overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] md:block">
        <div className="grid gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[420px_1fr] lg:px-12 lg:py-12">
          <div>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-white dark:text-[#071411]">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-h2 max-w-[430px] text-[var(--secondary)]">How to rent your first house</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="relative overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
                  <div className="absolute inset-0 bg-cover bg-center opacity-45 saturate-[0.95]" style={{ backgroundImage: `url(${item.image})` }} />
                  <div className="absolute inset-0 bg-[var(--card)]/55 backdrop-blur-[1px]" />
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)]">
                    <Icon size={22} />
                  </span>
                  <strong className="relative mt-5 block text-[24px] font-bold leading-[1.1] text-[var(--primary)]">{item.value}</strong>
                  <span className="relative mt-2 block text-[13px] font-medium leading-[1.45] text-[var(--muted-strong)]">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
