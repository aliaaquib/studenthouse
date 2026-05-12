import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Sofa, Users, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/sections/property-card";
import { properties } from "@/lib/data";

export function Listings() {
  return (
    <section className="bg-[var(--background)] py-16 sm:py-20 md:bg-gradient-to-b md:from-[var(--background)] md:to-[var(--surface)]">
      <div className="section-frame">
        <div className="flex items-start justify-between gap-6 md:hidden">
          <h2 className="max-w-[260px] text-[30px] font-medium leading-[1.18] tracking-[-0.01em] text-[#202328]">
            Find Your Perfect
            <br />
            College Home in
            <br />
            Jalal-Abad
          </h2>
          <Link
            href="/properties"
            aria-label="Browse all apartments"
            className="focus-ring mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[0_12px_28px_rgba(23,166,115,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--primary-light)]"
          >
            <ArrowRight size={22} />
          </Link>
        </div>

        <div className="hidden flex-col gap-6 md:flex md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-h2">
              Find Your Perfect College Home
              <br />
              in Jalal-Abad
            </h2>
          </div>
          <Button asChild size="lg">
            <Link href="/properties">Browse all apartments</Link>
          </Button>
        </div>

        <div className="mt-12 flex snap-x snap-mandatory gap-8 overflow-x-auto pb-6 scroll-smooth md:hidden">
          {properties.map((property) => (
            <Link
              key={property.slug}
              href={`/properties/${property.slug}`}
              className="w-[82vw] max-w-[330px] shrink-0 snap-start overflow-hidden rounded-[28px] bg-[var(--card)]"
            >
              <div className="h-[190px] overflow-hidden rounded-t-[28px]">
                <Image
                  src={property.image}
                  alt={property.name}
                  width={660}
                  height={380}
                  sizes="82vw"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="px-6 py-5">
                <p className="text-[20px] font-bold leading-[1.35] text-[var(--primary)]">
                  {property.price}
                  <span className="ml-1 text-[12px] font-medium text-[var(--muted)]">/month</span>
                </p>
                <h3 className="mt-2 text-[18px] font-semibold leading-[1.35] text-[#202328]">{property.name}</h3>
                <p className="mt-2 flex items-center gap-1.5 text-[13px] font-normal leading-[1.5] text-[var(--muted)]">
                  <MapPin size={15} /> {property.distance}
                </p>
                <div className="my-4 h-px bg-[var(--border)]" />
                <div className="grid grid-cols-2 gap-2 text-[12px] font-medium text-[var(--muted-strong)]">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Users size={16} color="var(--primary)" /> {property.roommates} roommates
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Sofa size={16} color="var(--primary)" /> {property.furnished ? "Furnished" : "Unfurnished"}
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Wifi size={16} color="var(--primary)" /> {property.utilitiesIncluded ? "Bills included" : "Bills separate"}
                  </span>
                  <span className="truncate rounded-full bg-[var(--surface)] px-2 py-1 text-center text-[var(--primary)]">{property.roomType}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {property.badges.slice(0, 3).map((badge) => (
                    <span key={badge} className="rounded-full bg-[var(--surface)] px-3 py-1 text-[11px] font-medium text-[var(--muted-strong)]">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 hidden snap-x snap-mandatory gap-6 overflow-x-auto pb-4 scroll-smooth sm:mt-14 md:flex">
          {properties.map((property) => (
            <div key={property.slug} className="w-[min(86vw,352px)] shrink-0 snap-start">
              <PropertyCard property={property} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
