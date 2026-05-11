import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, MessageCircle, PlayCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { assets } from "@/lib/assets";
import { universities } from "@/lib/data";

const trustItems = [
  { label: "Secure chat", icon: MessageCircle },
  { label: "Verified landlords", icon: ShieldCheck }
];

export function TenantLandlord() {
  return (
    <section className="bg-[var(--background)] py-16 md:py-20">
      <div className="section-frame grid items-center gap-12 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="relative h-[560px] max-w-[660px] md:h-[620px]">
          <div className="absolute left-0 top-0 h-[500px] w-full overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)] md:h-[580px] xl:w-[560px]">
            <Image
              src={assets.tenantHome}
              alt="Student apartment building exterior"
              fill
              sizes="(min-width: 1280px) 544px, 100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/28 to-transparent" />
          </div>
          <div className="absolute left-3 top-8 flex min-h-24 w-[min(410px,calc(100%-24px))] items-center gap-4 rounded-[18px] border border-[var(--border)] bg-[var(--card)] px-5 shadow-[var(--shadow-card)] md:h-28 md:gap-6 md:px-8">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)] md:h-16 md:w-16">
              <PlayCircle size={28} />
            </span>
            <span>
              <strong className="block text-[16px] leading-[1.6] text-[var(--secondary)]">Virtual room tours</strong>
              <span className="text-[13px] font-semibold leading-[1.6] text-[var(--muted)]">Preview rooms before you arrive</span>
            </span>
          </div>
          <div className="absolute bottom-0 left-4 flex min-h-24 w-[min(430px,calc(100%-32px))] items-center rounded-[18px] border border-[var(--border)] bg-[var(--card)] px-5 shadow-[var(--shadow-card)] md:left-[160px] md:h-28 md:px-8">
            <span>
              <strong className="block text-[16px] leading-[1.6] text-[var(--secondary)]">Verified student-safe listings</strong>
              <span className="text-[13px] font-semibold leading-[1.6] text-[var(--muted)]">Scam protection and trusted reviews</span>
            </span>
            <span className="absolute -top-7 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white md:-top-8 md:right-8 md:h-16 md:w-16 dark:text-[#071411]">
              <BadgeCheck size={28} />
            </span>
          </div>
        </div>
        <div>
          <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 text-[13px] font-extrabold text-[var(--muted)]">
            <span className="rounded-full bg-[var(--card)] px-4 py-2 text-[var(--primary)] shadow-[var(--shadow-card)]">Students</span>
            <span className="px-4 py-2">Landlords</span>
          </div>
          <h2 className="text-h2 mt-8 max-w-[560px]">Browse by university and move closer to campus.</h2>
          <p className="mt-5 max-w-[520px] text-[15px] font-semibold leading-[1.75] text-[var(--muted)]">
            Compare apartment counts, average rent, and nearby listings around your university before you message a landlord.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {universities.map((item) => (
              <Link key={item.slug} href={`/universities#${item.slug}`} className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-[var(--primary)]">
                <span className="text-[15px] font-extrabold">{item.name}</span>
                <span className="mt-2 block text-[13px] font-semibold text-[var(--muted)]">{item.apartmentCount} apartments · avg {item.averageRent}</span>
              </Link>
            ))}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {trustItems.map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 text-[14px] font-extrabold text-[var(--muted-strong)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)]"><Icon size={19} /></span>
                {label}
              </div>
            ))}
          </div>
          <Button asChild className="mt-8">
            <Link href="/auth/signup">
              Find housing near campus <ArrowRight size={20} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
