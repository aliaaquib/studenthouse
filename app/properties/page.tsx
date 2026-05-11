import { PageChrome, PageIntro } from "@/components/sections/page-chrome";
import { PropertyExplorer } from "@/components/sections/property-explorer";
import { properties } from "@/lib/data";

export default function PropertiesPage() {
  return (
    <PageChrome>
      <PageIntro title="Student apartments and shared rooms" copy="Filter verified housing by university, move-in date, budget, room type, roommate preferences, and bills included." />
      <section className="section-frame py-12">
        <PropertyExplorer properties={properties} />
      </section>
    </PageChrome>
  );
}
