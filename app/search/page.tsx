import { PageChrome, PageIntro } from "@/components/sections/page-chrome";
import { PropertyExplorer } from "@/components/sections/property-explorer";
import { defaultFilters } from "@/lib/property-utils";
import { getPublicProperties, getRegions } from "@/lib/db/queries";
import type { PropertyFilters } from "@/types/property";

function getInitialFilters(params: Partial<Record<keyof PropertyFilters | "type" | "city" | "q", string>>): PropertyFilters {
  const region = params.region ?? params.city;
  return {
    ...defaultFilters,
    query: params.q ?? "",
    budget: params.budget === "Under 15,000 KGS" || params.budget === "15,000 - 22,000 KGS" || params.budget === "22,000+ KGS" ? params.budget : defaultFilters.budget,
    roomType: params.type === "shared" ? "Shared room" : defaultFilters.roomType,
    ...(params.roomType === "Studio" || params.roomType === "Private room" || params.roomType === "Shared room" || params.roomType === "Apartment" || params.roomType === "Dom" ? { roomType: params.roomType } : {}),
    furnished: params.furnished === "Furnished" || params.furnished === "Unfurnished" ? params.furnished : defaultFilters.furnished,
    utilities: params.utilities === "Included" || params.utilities === "Separate" ? params.utilities : defaultFilters.utilities,
    genderPreference: params.genderPreference === "Female only" || params.genderPreference === "Male only" || params.genderPreference === "Mixed" ? params.genderPreference : defaultFilters.genderPreference,
    university: params.university ?? defaultFilters.university,
    region: region ?? defaultFilters.region
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Partial<Record<keyof PropertyFilters | "type" | "city" | "q", string>>> }) {
  const params = await searchParams;
  const initialFilters = getInitialFilters(params);
  const serverFilters = { ...initialFilters, query: "" };
  const [properties, regions] = await Promise.all([getPublicProperties(serverFilters), getRegions()]);

  return (
    <PageChrome>
      <PageIntro title="Search near your university" copy="Compare student apartments, shared rooms, verified landlords, and commute-friendly locations with map view support." />
      <PropertyExplorer
        properties={properties}
        activeRegions={regions.activeRegions}
        comingSoonRegions={regions.comingSoonRegions}
        variant="map"
        initialFilters={initialFilters}
      />
    </PageChrome>
  );
}
