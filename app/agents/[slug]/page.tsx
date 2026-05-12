import { Star } from "lucide-react";
import { ContactForm } from "@/components/sections/contact-form";
import { PageChrome } from "@/components/sections/page-chrome";
import { PropertyCard } from "@/components/sections/property-card";
import { agents, properties } from "@/lib/data";

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = agents.find((item) => item.slug === slug) ?? agents[0];

  return (
    <PageChrome>
      <section className="bg-[var(--surface)] py-16">
        <div className="section-frame grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="flex gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--primary)] text-[26px] font-bold text-white">
              {agent.name.split(" ").map((part) => part[0]).join("")}
            </div>
            <div>
              <h1 className="text-h2">{agent.name}</h1>
              <p className="mt-2 text-[15px] font-normal text-[var(--muted)]">{agent.title} · {agent.location}</p>
              <p className="mt-4 flex items-center gap-2 text-[15px] font-medium"><Star size={20} fill="var(--primary)" color="var(--primary)" /> {agent.rating} rating · {agent.deals} student placements</p>
            </div>
          </div>
          <ContactForm title="Contact housing advisor" />
        </div>
      </section>
      <section className="section-frame py-12">
        <h2 className="text-[22px] font-extrabold leading-[1.4]">Verified student listings</h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {properties.slice(0, 3).map((property) => <PropertyCard key={property.slug} property={property} />)}
        </div>
      </section>
    </PageChrome>
  );
}
