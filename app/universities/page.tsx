import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import { ComingSoonRegionCard } from "@/components/sections/coming-soon-region-card";
import { PageChrome, PageIntro } from "@/components/sections/page-chrome";
import { Button } from "@/components/ui/button";
import { cities, universities } from "@/lib/data";

export default function UniversitiesPage() {
  return (
    <PageChrome>
      <PageIntro title="Browse housing by university" copy="Find student apartments, shared rooms, roommate-friendly flats, and average rents around major campuses." />
      <section className="section-frame py-12">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {universities.map((university) => (
            <article id={university.slug} key={university.slug} className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)]">
                <Building2 size={22} />
              </span>
              <h2 className="mt-5 text-[20px] font-extrabold leading-[1.3]">{university.name}</h2>
              <p className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-[var(--muted)]"><MapPin size={15} /> {university.city}</p>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <span className="rounded-[14px] bg-[var(--surface)] p-3">
                  <strong className="block text-[16px] font-extrabold text-[var(--primary)]">{university.apartmentCount}</strong>
                  <small className="text-[11px] font-bold text-[var(--muted)]">apartments</small>
                </span>
                <span className="rounded-[14px] bg-[var(--surface)] p-3">
                  <strong className="block text-[16px] font-extrabold text-[var(--primary)]">{university.averageRent}</strong>
                  <small className="text-[11px] font-bold text-[var(--muted)]">avg rent</small>
                </span>
                <span className="rounded-[14px] bg-[var(--surface)] p-3">
                  <strong className="block text-[16px] font-extrabold text-[var(--primary)]">{university.nearbyListings}</strong>
                  <small className="text-[11px] font-bold text-[var(--muted)]">nearby</small>
                </span>
              </div>
              <Button asChild className="mt-6 w-full" variant="outline">
                <Link href="/search">View nearby listings</Link>
              </Button>
            </article>
          ))}
        </div>
      </section>
      <section className="section-frame pb-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-h2">Popular cities</h2>
            <p className="mt-3 text-[15px] font-semibold text-[var(--muted)]">Only Jalal-Abad and Manas are active at launch.</p>
          </div>
          <span className="rounded-full bg-[var(--surface)] px-4 py-2 text-[12px] font-extrabold text-[var(--primary)]">More cities coming soon</span>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cities.filter((city) => city.status === "active").map((city) => (
            <Link key={city.slug} href="/search" className="group relative min-h-[190px] overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--secondary)] p-5 text-white shadow-[var(--shadow-card)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(62,224,162,0.38),transparent_34%),linear-gradient(145deg,rgba(255,184,77,0.22),transparent)] transition duration-500 group-hover:scale-110" />
              <div className="relative flex h-full flex-col justify-end">
                <h3 className="text-[22px] font-extrabold">{city.name}</h3>
                <p className="mt-2 text-[13px] font-bold text-white/78">{city.count} listings · avg {city.averageRent}</p>
              </div>
            </Link>
          ))}
          {cities.filter((city) => city.status === "coming-soon").map((city) => <ComingSoonRegionCard key={city.slug} city={city} />)}
        </div>
      </section>
    </PageChrome>
  );
}
