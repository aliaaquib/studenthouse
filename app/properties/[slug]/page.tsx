import { PageChrome } from "@/components/sections/page-chrome";
import { PropertyDetailResolver } from "@/components/sections/property-detail-resolver";
import { getPropertyComments } from "@/lib/comments/queries";
import { getPublicProperties } from "@/lib/db/queries";

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const properties = await getPublicProperties();
  const property = properties.find((item) => item.slug === slug);
  const initialComments = property ? await getPropertyComments(property.id) : [];

  return (
    <PageChrome className="overflow-visible">
      <PropertyDetailResolver slug={slug} properties={properties} initialComments={initialComments} />
    </PageChrome>
  );
}
