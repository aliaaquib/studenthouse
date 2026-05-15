import { PageChrome, PageIntro } from "@/components/sections/page-chrome";
import { PropertyExplorer } from "@/components/sections/property-explorer";
import { getPublicProperties, getRegions } from "@/lib/db/queries";
import { defaultFilters } from "@/lib/property-utils";

export default async function SharedRoomsPage() {
  const initialFilters = { ...defaultFilters, roomType: "Shared room" as const };
  const [properties, regions] = await Promise.all([getPublicProperties(initialFilters), getRegions()]);

  return (
    <PageChrome>
      <PageIntro
        title="Shared rooms for students"
        copy="Explore shared student housing with verified roommates, lower monthly rent, and commute-friendly locations near campus."
      />
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
