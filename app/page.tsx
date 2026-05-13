import { Benefit } from "@/components/sections/benefit";
import { CTA } from "@/components/sections/cta";
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { Listings } from "@/components/sections/listings";
import { TenantLandlord } from "@/components/sections/tenant-landlord";
import { Testimonials } from "@/components/sections/testimonials";
import { getPublicProperties, getRegions } from "@/lib/db/queries";

export default async function HomePage() {
  const [properties, regions] = await Promise.all([getPublicProperties(), getRegions()]);

  return (
    <div className="figma-shell">
      <Header />
      <main>
        <Hero properties={properties} activeRegions={regions.activeRegions} comingSoonRegions={regions.comingSoonRegions} />
        <Listings properties={properties} />
        <Benefit />
        <TenantLandlord />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
