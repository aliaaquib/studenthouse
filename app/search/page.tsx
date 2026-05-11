import { PageChrome, PageIntro } from "@/components/sections/page-chrome";
import { PropertyExplorer } from "@/components/sections/property-explorer";
import { defaultFilters } from "@/lib/property-utils";
import { properties } from "@/lib/data";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const initialFilters = type === "shared" ? { ...defaultFilters, roomType: "Shared room" as const } : defaultFilters;

  return (
    <PageChrome>
      <PageIntro title="Search near your university" copy="Compare student apartments, shared rooms, verified landlords, and commute-friendly locations with map view support." />
      <PropertyExplorer properties={properties} variant="map" initialFilters={initialFilters} />
    </PageChrome>
  );
}
