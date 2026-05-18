"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";
import { PropertyDetailView } from "@/components/sections/property-detail-view";
import { Button } from "@/components/ui/button";
import type { PropertyComment } from "@/types/comment";
import type { Property } from "@/types/property";

export function PropertyDetailResolver({
  slug,
  properties,
  initialComments
}: {
  slug: string;
  properties: Property[];
  initialComments: PropertyComment[];
}) {
  const property = properties.find((item) => item.slug === slug);

  if (!property) {
    return (
      <section className="section-frame py-12">
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-[var(--shadow-card)]">
          <SearchX className="mx-auto text-[var(--primary)]" size={36} />
          <h1 className="mt-4 text-[24px] font-semibold">This listing is no longer available</h1>
          <p className="mx-auto mt-2 max-w-[440px] text-[14px] font-normal leading-[1.7] text-[var(--muted)]">
            It may have been deleted, marked unavailable, or moved to draft by the admin team.
          </p>
          <Button asChild className="mt-6">
            <Link href="/properties">Browse available apartments</Link>
          </Button>
        </div>
      </section>
    );
  }

  const similarProperties = properties
    .filter((item) => item.id !== property.id && (item.university === property.university || item.city === property.city))
    .slice(0, 2);

  return <PropertyDetailView property={property} similarProperties={similarProperties} initialComments={initialComments} />;
}
