import { PageChrome, PageIntro } from "@/components/sections/page-chrome";
import { UniversitiesBrowser } from "@/components/sections/universities-browser";
import { getRegions, getUniversities } from "@/lib/db/queries";

export default async function UniversitiesPage() {
  const [universities, regions] = await Promise.all([getUniversities(), getRegions()]);

  return (
    <PageChrome>
      <PageIntro title="Browse housing by university" copy="Find student apartments, shared rooms, roommate-friendly flats, and average rents around major campuses." />
      <UniversitiesBrowser universities={universities} activeRegions={regions.activeRegions} comingSoonRegions={regions.comingSoonRegions} cities={regions.cities} />
    </PageChrome>
  );
}
