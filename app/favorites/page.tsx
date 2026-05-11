import { PageChrome, PageIntro } from "@/components/sections/page-chrome";
import { SavedApartments } from "@/components/sections/saved-apartments";
import { properties } from "@/lib/data";

export default function FavoritesPage() {
  return (
    <PageChrome>
      <PageIntro title="Saved apartments" copy="Compare your favorite verified rooms, student flats, commute times, and landlord responses before booking a tour." />
      <SavedApartments properties={properties} />
    </PageChrome>
  );
}
