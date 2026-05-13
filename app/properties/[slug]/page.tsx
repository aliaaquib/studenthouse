import { PageChrome } from "@/components/sections/page-chrome";
import { PropertyDetailResolver } from "@/components/sections/property-detail-resolver";
import { getPublicProperties } from "@/lib/db/queries";

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const properties = await getPublicProperties();

  return (
    <PageChrome>
      <PropertyDetailResolver slug={slug} properties={properties} />
    </PageChrome>
  );
}
