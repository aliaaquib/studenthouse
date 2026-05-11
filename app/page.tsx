import { Benefit } from "@/components/sections/benefit";
import { CTA } from "@/components/sections/cta";
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { Listings } from "@/components/sections/listings";
import { TenantLandlord } from "@/components/sections/tenant-landlord";
import { Testimonials } from "@/components/sections/testimonials";

export default function HomePage() {
  return (
    <div className="figma-shell">
      <Header />
      <main>
        <Hero />
        <TenantLandlord />
        <Benefit />
        <Listings />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
