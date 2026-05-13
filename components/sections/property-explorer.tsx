"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MapPin, SearchX, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUpVariants, staggerContainer } from "@/components/motion";
import { PropertyCard } from "@/components/sections/property-card";
import { PropertyFilters } from "@/components/sections/property-filters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trackSearchAction } from "@/lib/actions/user-data";
import { defaultFilters, smartSearchProperties } from "@/lib/property-utils";
import type { Property, PropertyFilters as PropertyFiltersValue, Region } from "@/types/property";

const pinClasses = [
  "left-[18%] top-[18%]",
  "left-[34%] top-[40%]",
  "left-[48%] top-[62%]",
  "left-[62%] top-[18%]",
  "left-[76%] top-[40%]"
];

export function PropertyExplorer({
  properties,
  activeRegions,
  comingSoonRegions,
  variant = "grid",
  limit,
  initialFilters = defaultFilters
}: {
  properties: Property[];
  activeRegions: Region[];
  comingSoonRegions: Region[];
  variant?: "grid" | "map";
  limit?: number;
  initialFilters?: PropertyFiltersValue;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<PropertyFiltersValue>(initialFilters);
  const [resetKey, setResetKey] = useState(0);
  const [isPending, startTransition] = useTransition();
  const universities = useMemo(() => Array.from(new Set(properties.map((property) => property.university))), [properties]);
  const searchState = useMemo(() => smartSearchProperties(properties, filters), [filters, properties]);
  const filteredProperties = useMemo(() => searchState.properties.slice(0, limit), [limit, searchState.properties]);

  const handleFiltersChange = useCallback((nextFilters: PropertyFiltersValue) => {
    startTransition(() => setFilters(nextFilters));
  }, [startTransition]);

  const syncSearchUrl = useCallback((nextFilters: PropertyFiltersValue) => {
    void trackSearchAction({
      query: nextFilters.query,
      region: nextFilters.region !== "Any" ? nextFilters.region : undefined,
      university: nextFilters.university !== "Any" ? nextFilters.university : undefined,
      roomType: nextFilters.roomType !== "Any" ? nextFilters.roomType : undefined
    });

    const params = new URLSearchParams();
    if (nextFilters.query.trim()) params.set("q", nextFilters.query.trim());
    if (nextFilters.region !== "Any") params.set("region", nextFilters.region);
    if (nextFilters.roomType !== "Any") params.set("roomType", nextFilters.roomType);
    if (nextFilters.budget !== "Any") params.set("budget", nextFilters.budget);
    if (nextFilters.university !== "Any") params.set("university", nextFilters.university);
    if (nextFilters.furnished !== "Any") params.set("furnished", nextFilters.furnished);
    if (nextFilters.utilities !== "Any") params.set("utilities", nextFilters.utilities);
    if (nextFilters.genderPreference !== "Any") params.set("genderPreference", nextFilters.genderPreference);

    const nextPath = pathname === "/search" ? "/search" : "/properties";
    const queryString = params.toString();
    router.push(queryString ? `${nextPath}?${queryString}` : nextPath);
  }, [pathname, router]);

  function clearFilters() {
    setResetKey((value) => value + 1);
    handleFiltersChange(defaultFilters);
    syncSearchUrl(defaultFilters);
  }

  const grid = (
    <div>
      <PropertyFilters
        key={resetKey}
        universities={universities}
        activeRegions={activeRegions}
        comingSoonRegions={comingSoonRegions}
        onFiltersChange={handleFiltersChange}
        onSearchSubmit={syncSearchUrl}
        initialFilters={filters}
      />
      {!isPending && searchState.mode === "nearby" ? (
        <div className="mt-5 rounded-[18px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 shadow-[var(--shadow-card)]">
          <p className="text-[16px] font-semibold">No exact apartments found in {searchState.displayQuery}.</p>
          <p className="mt-1 text-[14px] font-normal leading-[1.7] text-[var(--muted)]">
            Showing nearby student housing instead{searchState.nearbyLabel ? ` around ${searchState.nearbyLabel}.` : "."}
          </p>
        </div>
      ) : null}
      {!isPending && searchState.mode === "recommended" ? (
        <div className="mt-5 rounded-[18px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 shadow-[var(--shadow-card)]">
          <p className="flex items-center gap-2 text-[16px] font-semibold"><Sparkles size={16} color="var(--primary)" /> No exact apartments found in {searchState.displayQuery}.</p>
          <p className="mt-1 text-[14px] font-normal leading-[1.7] text-[var(--muted)]">
            Showing recommended student housing that still matches your filters.
          </p>
        </div>
      ) : null}
      {isPending ? (
        <div className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => <Skeleton key={item} className="h-[506px]" />)}
        </div>
      ) : null}
      {!isPending && filteredProperties.length > 0 ? (
        <motion.div
          className={variant === "map" ? "mt-8 grid gap-8 md:grid-cols-2" : "mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-3"}
          initial="hidden"
          animate="show"
          variants={staggerContainer}
        >
          {filteredProperties.map((property) => (
            <motion.div key={property.id} variants={fadeUpVariants}>
              <PropertyCard property={property} />
            </motion.div>
          ))}
        </motion.div>
      ) : null}
      {!isPending && filteredProperties.length === 0 ? (
        <div className="mt-8 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-[var(--shadow-card)]">
          <SearchX className="mx-auto text-[var(--primary)]" size={34} />
          <h2 className="mt-4 text-[22px] font-semibold">No apartments found</h2>
          <p className="mx-auto mt-2 max-w-[420px] text-[14px] font-normal leading-[1.7] text-[var(--muted)]">
            Try a different location, university, budget, room type, or roommate preference.
          </p>
          <Button className="mt-5" variant="outline" onClick={clearFilters}>Clear filters</Button>
        </div>
      ) : null}
    </div>
  );

  if (variant === "grid") return grid;

  return (
    <section className="section-frame grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
      {grid}
      <aside className="h-[360px] rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] lg:sticky lg:top-28 lg:h-[520px] lg:p-5">
        <div className="relative h-full overflow-hidden rounded-[16px] bg-[var(--card)]">
          <div className="absolute inset-0 opacity-55 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:42px_42px]" />
          {filteredProperties.slice(0, 5).map((property, index) => (
            <a
              key={property.id}
              href={`/properties/${property.slug}`}
              className={`focus-ring motion-surface absolute flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[0_10px_30px_rgba(23,166,115,0.3)] transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 ${pinClasses[index]}`}
              aria-label={`View ${property.title} on map`}
            >
              <MapPin size={20} />
            </a>
          ))}
        </div>
      </aside>
    </section>
  );
}
