import Image from "next/image";
import { BadgePercent, ShieldCheck } from "lucide-react";
import { assets } from "@/lib/assets";

export function TenantLandlord() {
  return (
    <section className="relative overflow-hidden bg-[var(--background)] py-10 md:py-20 lg:py-24">
      <div className="pointer-events-none absolute -right-40 top-2 h-[520px] w-[440px] rotate-[28deg] rounded-[70px] bg-[#f6f5f1] opacity-70 lg:hidden" />
      <div className="pointer-events-none absolute -right-24 top-0 hidden h-[720px] w-[760px] rounded-[48%] border-[72px] border-[#f4f3ef] opacity-85 lg:block" />
      <div className="pointer-events-none absolute right-[-120px] top-[-90px] hidden h-[360px] w-[640px] rotate-[35deg] rounded-[60px] bg-[#f6f5f1] opacity-80 lg:block" />

      <div className="section-frame relative">
        <h2 className="perfect-room-heading mb-8 text-[30px] font-medium leading-[1.2] tracking-[-0.01em] sm:text-[38px] lg:hidden">
          <span className="whitespace-nowrap">We Will Help You Find</span>
          <br />
          <span className="whitespace-nowrap">
            Your{" "}
            <span className="relative inline-block font-light text-[var(--primary)]">
              Perfect Room!
              <svg className="absolute -bottom-3 left-0 h-3 w-[78%]" viewBox="0 0 180 18" fill="none" aria-hidden="true">
                <path d="M3 12C47 3 111 3 177 10" stroke="#fff38a" strokeWidth="7" strokeLinecap="round" />
              </svg>
            </span>
          </span>
        </h2>
        <div className="grid grid-cols-12 gap-4 md:gap-6 lg:grid-cols-[420px_1fr_0.86fr] lg:grid-rows-[auto_auto] lg:items-start lg:gap-8 xl:grid-cols-[500px_1fr_0.86fr]">
          <div className="hidden lg:col-start-1 lg:row-start-1 lg:block">
            <h2 className="perfect-room-heading max-w-[500px] text-[30px] font-medium leading-[1.12] tracking-[-0.01em] sm:text-[38px] lg:text-[38px] xl:text-[44px]">
              <span className="whitespace-nowrap">We Will Help You Find</span>
              <br />
              <span className="whitespace-nowrap">
                Your{" "}
                <span className="relative inline-block font-light text-[var(--primary)]">
                  Perfect Room!
                  <svg className="absolute -bottom-4 left-0 h-4 w-[78%]" viewBox="0 0 180 18" fill="none" aria-hidden="true">
                    <path d="M3 12C47 3 111 3 177 10" stroke="#fff38a" strokeWidth="7" strokeLinecap="round" />
                  </svg>
                </span>
              </span>
            </h2>
          </div>

          <div className="col-span-8 col-start-1 row-start-1 rounded-[34px] bg-[#e4e0ff] p-6 text-[#2c2d34] shadow-[0_18px_54px_rgba(109,99,238,0.12)] sm:p-8 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:rounded-[30px] lg:p-10">
            <ShieldCheck className="text-[#6f63ee]" size={38} strokeWidth={2.2} />
            <h3 className="mt-7 text-[22px] font-semibold leading-[1.16] sm:text-[26px] lg:mt-6 lg:whitespace-nowrap lg:text-[22px]">Perfect Home Guarantee</h3>
            <p className="mt-5 text-[18px] font-light leading-[1.55] text-[#56515f] sm:text-[22px] lg:mt-4 lg:text-[16px] lg:leading-[1.65]">
              We work with only trusted partners to give you peace of mind during your stay at your home away from home.
            </p>
          </div>

          <div className="relative col-span-4 col-start-9 row-start-1 min-h-[300px] overflow-hidden rounded-[30px] bg-[var(--surface)] shadow-[var(--shadow-card)] sm:min-h-[420px] lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:min-h-[300px]">
            <Image
              src={assets.heroSmallAlt}
              alt="Student relaxing with laptop in a bright room"
              fill
              sizes="(min-width: 1024px) 360px, 100vw"
              className="object-cover"
            />
          </div>

          <div className="col-span-8 col-start-5 row-start-2 rounded-[34px] bg-[#ffd83d] p-6 text-[#29313a] shadow-[0_18px_48px_rgba(226,177,18,0.16)] sm:p-8 lg:col-span-1 lg:col-start-1 lg:row-start-2 lg:mt-8 lg:rounded-[30px] lg:p-10">
            <BadgePercent className="text-[#285f5b]" size={38} strokeWidth={2.2} />
            <h3 className="mt-7 text-[22px] font-semibold leading-[1.16] sm:text-[26px] lg:mt-8 lg:text-[22px]">Price Match Promise</h3>
            <p className="mt-5 text-[18px] font-light leading-[1.55] text-[#4f5360] sm:text-[22px] lg:mt-4 lg:text-[16px] lg:leading-[1.65]">
              If you find your choice of housing available at a lower price, we will match that price at your time of booking.
            </p>
          </div>

          <div className="relative col-span-4 col-start-1 row-start-2 min-h-[300px] overflow-hidden rounded-[30px] bg-[var(--surface)] shadow-[var(--shadow-card)] sm:min-h-[420px] lg:col-span-1 lg:col-start-2 lg:row-start-2 lg:mt-8 lg:min-h-[300px]">
            <Image
              src={assets.heroSmall}
              alt="Student comparing housing options on a tablet"
              fill
              sizes="(min-width: 1024px) 360px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
