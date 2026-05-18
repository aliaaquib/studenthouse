import { PageChrome, PageIntro } from "@/components/sections/page-chrome";
import { PropertyExplorer } from "@/components/sections/property-explorer";
import { getPublicProperties, getRegions } from "@/lib/db/queries";
import { defaultFilters } from "@/lib/property-utils";
import type { PropertyFilters } from "@/types/property";

function getInitialFilters(params: Partial<Record<keyof PropertyFilters | "q", string>>): PropertyFilters {
  return {
    ...defaultFilters,
    query: params.q ?? params.query ?? "",
    budget: params.budget === "Under 15,000 KGS" || params.budget === "15,000 - 22,000 KGS" || params.budget === "22,000+ KGS" ? params.budget : defaultFilters.budget,
    roomType: params.roomType === "Studio" || params.roomType === "Private room" || params.roomType === "Shared room" || params.roomType === "Apartment" || params.roomType === "Dom" ? params.roomType : defaultFilters.roomType,
    furnished: params.furnished === "Furnished" || params.furnished === "Unfurnished" ? params.furnished : defaultFilters.furnished,
    utilities: params.utilities === "Included" || params.utilities === "Separate" ? params.utilities : defaultFilters.utilities,
    genderPreference: params.genderPreference === "Female only" || params.genderPreference === "Male only" || params.genderPreference === "Mixed" ? params.genderPreference : defaultFilters.genderPreference,
    university: params.university ?? defaultFilters.university,
    region: params.region ?? defaultFilters.region
  };
}

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<Partial<Record<keyof PropertyFilters | "q", string>>> }) {
  const params = await searchParams;
  const initialFilters = getInitialFilters(params);
  const serverFilters = { ...initialFilters, query: "" };
  const [properties, regions] = await Promise.all([getPublicProperties(serverFilters), getRegions()]);

  return (
    <PageChrome>
      <PageIntro title="Student apartments and shared rooms" copy="Filter verified housing by university, move-in date, budget, room type, roommate preferences, and bills included." />
      <section className="section-frame py-12">
        <PropertyExplorer
          properties={properties}
          activeRegions={regions.activeRegions}
          comingSoonRegions={regions.comingSoonRegions}
          initialFilters={initialFilters}
        />
      </section>
    </PageChrome>
  );
}
