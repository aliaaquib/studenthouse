import Link from "next/link";
import { MapPin } from "lucide-react";
import { PageChrome, PageIntro } from "@/components/sections/page-chrome";
import { getRegions } from "@/lib/db/queries";

export default async function PopularLocationsPage() {
  const regions = await getRegions();

  return (
    <PageChrome>
      <PageIntro
        title="Popular student housing locations"
        copy="Start with the most active student housing area today, then keep an eye on upcoming cities as StudentNest expands across Kyrgyzstan."
      />
      <section className="section-frame grid gap-8 py-12 lg:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-4">
          {regions.activeRegions.map((region) => (
            <Link
              key={region.slug}
              href={`/properties?region=${encodeURIComponent(region.name)}`}
              className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5"
            >
              <MapPin className="text-[var(--primary)]" size={22} />
              <h2 className="mt-4 text-[22px] font-semibold">{region.name}</h2>
              <p className="mt-2 text-[14px] font-normal leading-[1.7] text-[var(--muted)]">Browse verified student apartments, private rooms, and shared housing currently available in this area.</p>
            </Link>
          ))}
        </div>
        <div className="rounded-[28px] bg-[var(--surface)] p-7 sm:p-9">
          <h2 className="text-[28px] font-medium leading-[1.18] tracking-[-0.01em] sm:text-[36px]">More cities are coming soon.</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {regions.comingSoonRegions.map((region) => (
              <span key={region.slug} className="rounded-full bg-[var(--card)] px-4 py-2 text-[14px] font-medium text-[var(--muted-strong)] shadow-[var(--shadow-card)]">
                {region.name}
              </span>
            ))}
          </div>
        </div>
      </section>
    </PageChrome>
  );
}
