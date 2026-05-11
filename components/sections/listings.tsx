import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/sections/property-card";
import { properties } from "@/lib/data";

export function Listings() {
  return (
    <section className="bg-gradient-to-b from-[var(--background)] to-[var(--surface)] py-16 sm:py-20">
      <div className="section-frame">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-h2">Featured student apartments</h2>
            <p className="mt-4 max-w-[560px] text-[15px] font-semibold leading-[1.7] text-[var(--muted)]">
              Verified apartments, shared rooms, and student-friendly rentals near top universities.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/properties">Browse all apartments</Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-6 sm:mt-14 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.slug} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
}
