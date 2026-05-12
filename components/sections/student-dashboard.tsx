"use client";

import Link from "next/link";
import { CalendarDays, Heart, Home, MessageSquare, Search, Settings } from "lucide-react";
import { PropertyCard } from "@/components/sections/property-card";
import { Input } from "@/components/ui/input";
import { useSavedProperties } from "@/hooks/use-saved-properties";
import type { Property } from "@/types/property";

const recentSearches = ["JAIU under 15,000 KGS", "Shared room Jalal-Abad", "Female only CAIMU"];
const inquiryHistory = ["Virtual tour requested", "WhatsApp landlord opened", "Booking request drafted"];

export function StudentDashboard({ properties }: { properties: Property[] }) {
  const { savedSet } = useSavedProperties();
  const savedProperties = properties.filter((property) => savedSet.has(property.id));
  const viewedProperties = properties.slice(0, 3);
  const metrics = [
    { icon: Heart, value: String(savedProperties.length), label: "Saved apartments" },
    { icon: CalendarDays, value: "4", label: "Tours booked" },
    { icon: MessageSquare, value: "8", label: "Landlord chats" },
    { icon: Home, value: "2", label: "Applications" }
  ];

  return (
    <section className="section-frame py-12">
      <div className="grid gap-6 md:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
              <Icon color="var(--primary)" />
              <strong className="mt-4 block text-[26px] leading-[1.25]">{metric.value}</strong>
              <span className="text-[14px] font-medium text-[var(--muted)]">{metric.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="text-[22px] font-semibold leading-[1.4]">Saved apartments</h2>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            {(savedProperties.length ? savedProperties : properties.slice(0, 2)).map((property) => <PropertyCard key={property.id} property={property} />)}
          </div>
        </div>
        <aside className="grid gap-5 self-start">
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
            <h2 className="flex items-center gap-2 text-[18px] font-semibold"><Search size={18} color="var(--primary)" /> Recent searches</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {recentSearches.map((item) => <span key={item} className="rounded-full bg-[var(--surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--muted-strong)]">{item}</span>)}
            </div>
          </div>
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
            <h2 className="flex items-center gap-2 text-[18px] font-semibold"><MessageSquare size={18} color="var(--primary)" /> Inquiry history</h2>
            <ul className="mt-4 space-y-3 text-[13px] font-normal text-[var(--muted)]">
              {inquiryHistory.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
            <h2 className="flex items-center gap-2 text-[18px] font-semibold"><Settings size={18} color="var(--primary)" /> Profile settings</h2>
            <div className="mt-4 grid gap-3">
              <Input aria-label="Preferred university" placeholder="Preferred university" defaultValue="JAIU" />
              <Input aria-label="Monthly budget" placeholder="Monthly budget" defaultValue="15,000 сом" />
            </div>
          </div>
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-[18px] font-semibold">Viewed properties</h2>
            <div className="mt-4 grid gap-3">
              {viewedProperties.map((property) => (
                <Link key={property.id} href={`/properties/${property.slug}`} className="rounded-[14px] bg-[var(--surface)] p-3 text-[13px] font-medium hover:text-[var(--primary)]">
                  {property.title}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
