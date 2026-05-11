import { notFound } from "next/navigation";
import { PageChrome } from "@/components/sections/page-chrome";
import { PropertyDetailView } from "@/components/sections/property-detail-view";
import { properties } from "@/lib/data";

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = properties.find((item) => item.slug === slug);
  if (!property) notFound();

  const similarProperties = properties
    .filter((item) => item.id !== property.id && (item.university === property.university || item.city === property.city))
    .slice(0, 2);

  return (
    <PageChrome>
      <PropertyDetailView property={property} similarProperties={similarProperties} />
    </PageChrome>
  );
}
