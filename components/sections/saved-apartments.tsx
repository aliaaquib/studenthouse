"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUpVariants, staggerContainer } from "@/components/motion";
import { useSavedProperties } from "@/hooks/use-saved-properties";
import { PropertyCard } from "@/components/sections/property-card";
import { Button } from "@/components/ui/button";
import type { Property } from "@/types/property";

export function SavedApartments({ properties }: { properties: Property[] }) {
  const { savedSet, loading } = useSavedProperties();
  const visibleProperties = loading ? properties : properties.filter((property) => savedSet.has(property.id));

  if (!loading && visibleProperties.length === 0) {
    return (
      <section className="section-frame py-12">
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-[var(--shadow-card)]">
          <Heart className="mx-auto text-[var(--primary)]" size={36} />
          <h2 className="mt-4 text-[24px] font-semibold">No saved apartments yet</h2>
          <p className="mx-auto mt-2 max-w-[440px] text-[14px] font-normal leading-[1.7] text-[var(--muted)]">
            Tap the heart on any apartment to build your shortlist and compare rooms later.
          </p>
          <Button asChild className="mt-6">
            <Link href="/properties">View apartments</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      className="section-frame grid gap-8 py-12 md:grid-cols-2 xl:grid-cols-3"
      initial="hidden"
      animate="show"
      variants={staggerContainer}
    >
      {visibleProperties.map((property) => (
        <motion.div key={property.id} variants={fadeUpVariants}>
          <PropertyCard property={property} />
        </motion.div>
      ))}
    </motion.section>
  );
}
