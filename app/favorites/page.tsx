import { PageChrome, PageIntro } from "@/components/sections/page-chrome";
import { SavedApartments } from "@/components/sections/saved-apartments";
import { requireUser } from "@/lib/auth/guards";
import { getFavoritePropertiesForCurrentUser } from "@/lib/db/queries";

export default async function FavoritesPage() {
  await requireUser("/favorites");
  const properties = await getFavoritePropertiesForCurrentUser();

  return (
    <PageChrome>
      <PageIntro title="Saved apartments" copy="Compare your favorite verified rooms, student flats, commute times, and landlord responses before booking a tour." />
      <SavedApartments properties={properties} />
    </PageChrome>
  );
}
