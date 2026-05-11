import Link from "next/link";
import Image from "next/image";
import { CalendarDays, GraduationCap, MapPin, Search, WalletCards } from "lucide-react";
import { MotionDiv } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { assets } from "@/lib/assets";
import { properties } from "@/lib/data";
import { PropertyCard } from "@/components/sections/property-card";

export function Hero() {
  return (
    <section className="relative bg-[var(--surface)] pb-16 md:pb-20 lg:min-h-[820px]">
      <div className="absolute right-0 top-0 hidden h-full w-[48%] overflow-hidden lg:block">
        <Image
          src={assets.heroMap}
          alt=""
          fill
          sizes="49vw"
          priority
          className="object-cover opacity-75 saturate-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface)] via-[color-mix(in_srgb,var(--surface)_72%,transparent)] to-transparent" />
      </div>
      <div className="section-frame relative grid gap-12 pt-12 md:pt-16 lg:grid-cols-[560px_1fr] lg:pt-[76px]">
        <div>
          <MotionDiv initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-[12px] font-extrabold text-[var(--primary)] shadow-[var(--shadow-card)]">
              <GraduationCap size={16} /> Verified student housing
            </div>
            <h1 className="text-h1 max-w-[680px] text-balance">Find Your Perfect Student Apartment</h1>
            <p className="mt-5 max-w-[520px] text-[15px] font-semibold leading-[1.75] text-[var(--muted)] md:mt-7 md:text-[17px]">
              Safe, affordable student housing near your university. Browse verified apartments, shared rooms, and student-friendly rentals.
            </p>
          </MotionDiv>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/properties">Browse Apartments</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/universities">Explore Universities</Link>
            </Button>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-3 md:mt-11">
            {[
              ["15,000+", "Students Housed"],
              ["3,200+", "Verified Apartments"],
              ["850+", "Trusted Landlords"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-[16px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-card)]">
                <p className="text-[22px] font-extrabold leading-[1.2] text-[var(--primary)]">{value}</p>
                <p className="mt-1 text-[12px] font-bold leading-[1.5] text-[var(--muted)]">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 max-w-[880px] md:mt-12">
            <div className="relative">
              <div className="absolute left-0 top-4 h-[120px] w-full rounded-[24px] bg-[var(--primary)] opacity-10 blur-[28px]" />
              <div className="relative grid gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-card-hover)] md:grid-cols-[1.2fr_1fr_0.9fr_0.95fr_auto] md:items-center">
                {[
                  ["University or City", "JAIU, Jalal-Abad", <Search key="search" size={17} />],
                  ["Move-in Date", "August 2026", <CalendarDays key="calendar" size={17} />],
                  ["Budget", "Under 15,000 KGS", <WalletCards key="budget" size={17} />],
                  ["Room Type", "Shared or studio", <GraduationCap key="room" size={17} />]
                ].map(([label, value, icon]) => (
                  <div key={String(label)} className="min-w-0 rounded-[16px] bg-[var(--surface)] px-4 py-3">
                    <p className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.04em] text-[var(--muted)]">{icon}{label}</p>
                    <p className="mt-1 truncate text-[14px] font-extrabold leading-[1.45]">{value}</p>
                  </div>
                ))}
                <Button asChild size="lg" className="w-full md:w-auto">
                  <Link href="/search">Search</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <MotionDiv
          className="relative hidden min-h-[640px] lg:block"
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
        >
          <div className="absolute left-[42px] top-0 w-[340px]">
            <PropertyCard property={properties[0]} priority />
          </div>
          <div className="absolute bottom-5 right-0 w-[218px]">
            <PropertyCard property={properties[1]} compact />
          </div>
          <div className="absolute right-[138px] top-[270px] flex h-16 w-14 items-center justify-center">
            <div className="absolute bottom-0 h-4 w-4 rounded-full bg-[var(--primary)]" />
            <div className="absolute top-0 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[0_10px_30px_rgba(23,166,115,0.32)] dark:text-[#071411]">
              <GraduationCap size={24} />
            </div>
          </div>
          <div className="absolute right-[158px] top-[40px] flex h-14 w-14 items-center justify-center rounded-full border border-[var(--primary)] bg-[var(--card)] text-[var(--primary)]">
            <MapPin size={22} fill="currentColor" />
          </div>
        </MotionDiv>
      </div>
    </section>
  );
}
