"use client";

import Image from "next/image";
import { BadgeCheck, CalendarDays, Heart, MapPin, MessageCircle, PlayCircle, Sofa, Users, Wifi } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { ContactForm } from "@/components/sections/contact-form";
import { PropertyCard } from "@/components/sections/property-card";
import { Button } from "@/components/ui/button";
import { getWhatsAppHref } from "@/lib/property-utils";
import { useSavedProperties } from "@/hooks/use-saved-properties";
import type { Property } from "@/types/property";

const tourItems = [
  { icon: PlayCircle, title: "Virtual tour", copy: "Preview the room remotely" },
  { icon: CalendarDays, title: "Visit slots", copy: "Weekday and weekend times" },
  { icon: BadgeCheck, title: "Verified host", copy: "Student-safe listing checks" }
];

export function PropertyDetailView({ property, similarProperties }: { property: Property; similarProperties: Property[] }) {
  const [activeImage, setActiveImage] = useState(property.images[0]);
  const { isSaved, toggleSaved } = useSavedProperties();
  const saved = isSaved(property.id);

  return (
    <section className="section-frame grid gap-10 py-12 lg:grid-cols-[1fr_372px]">
      <div>
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <motion.div key={activeImage} initial={{ opacity: 0.72 }} animate={{ opacity: 1 }}>
            <Image
              src={activeImage}
              alt={property.name}
              width={900}
              height={520}
              priority
              sizes="(min-width: 1024px) 720px, 100vw"
              className="h-[260px] w-full rounded-[20px] object-cover sm:h-[360px] lg:h-[430px]"
            />
          </motion.div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
            {property.images.slice(1, 3).map((image) => (
              <button key={image} type="button" className="focus-ring overflow-hidden rounded-[20px]" onClick={() => setActiveImage(image)}>
                <Image
                  src={image}
                  alt=""
                  width={360}
                  height={220}
                  sizes="(min-width: 768px) 240px, 50vw"
                  className="h-[126px] w-full object-cover transition duration-300 hover:scale-105 sm:h-[172px] lg:h-[207px]"
                />
              </button>
            ))}
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[28px] font-extrabold leading-[1.2] text-[var(--primary)]">
              {property.price}
              <span className="text-[14px] font-medium text-[var(--muted)]">/month</span>
            </p>
            <h1 className="mt-2 text-h2">{property.name}</h1>
            <p className="mt-3 flex items-center gap-2 text-[15px] font-semibold text-[var(--muted)]">
              <MapPin size={18} /> {property.location} · {property.distance}
            </p>
            <p className="mt-2 text-[13px] font-extrabold text-[var(--muted)]">Property ID: {property.id} · Available {property.availabilityDate}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            <Button type="button" variant="outline" onClick={() => toggleSaved(property.id)}>
              <Heart size={18} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save apartment"}
            </Button>
            <Button asChild>
              <a href={getWhatsAppHref(property, "requesting a booking for")} target="_blank" rel="noreferrer">
                <MessageCircle size={18} /> Book Visit
              </a>
            </Button>
          </div>
        </div>
        <div className="mt-8 grid gap-4 border-y border-[var(--border)] py-6 sm:grid-cols-4">
          <span className="flex items-center gap-3 text-[14px] font-extrabold"><Users color="var(--primary)" /> {property.roommates} roommates</span>
          <span className="flex items-center gap-3 text-[14px] font-extrabold"><Sofa color="var(--primary)" /> {property.furnished ? "Furnished" : "Unfurnished"}</span>
          <span className="flex items-center gap-3 text-[14px] font-extrabold"><Wifi color="var(--primary)" /> {property.utilitiesIncluded ? "Bills included" : "Bills separate"}</span>
          <span className="flex items-center gap-3 text-[14px] font-extrabold"><BadgeCheck color="var(--primary)" /> Verified</span>
        </div>
        <p className="mt-8 max-w-[760px] text-[15px] font-semibold leading-[1.75] text-[var(--muted)]">{property.description}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {property.badges.map((badge) => (
            <span key={badge} className="rounded-full bg-[var(--surface)] px-3 py-1.5 text-[12px] font-extrabold text-[var(--muted-strong)]">{badge}</span>
          ))}
        </div>
        <div className="mt-10 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-[20px] font-extrabold leading-[1.35]">Amenities</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {property.amenities.map((amenity) => (
              <span key={amenity} className="rounded-[14px] bg-[var(--surface)] px-4 py-3 text-[13px] font-extrabold text-[var(--muted-strong)]">{amenity}</span>
            ))}
          </div>
        </div>
        <div className="mt-10 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-[20px] font-extrabold leading-[1.35]">Virtual tour and booking</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {tourItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[16px] bg-[var(--surface)] p-4">
                  <Icon color="var(--primary)" />
                  <strong className="mt-3 block text-[14px] font-extrabold">{item.title}</strong>
                  <span className="mt-1 block text-[12px] font-semibold leading-[1.6] text-[var(--muted)]">{item.copy}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-10 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-[20px] font-extrabold leading-[1.35]">Nearby university</h2>
          <p className="mt-3 text-[15px] font-semibold leading-[1.7] text-[var(--muted)]">
            {property.university} is {property.distance.toLowerCase()}, with student-friendly transit, grocery access, and verified landlord support nearby.
          </p>
        </div>
        {similarProperties.length > 0 ? (
          <div className="mt-12">
            <h2 className="text-[22px] font-extrabold leading-[1.4]">Similar apartments</h2>
            <div className="mt-6 grid gap-8 md:grid-cols-2">
              {similarProperties.map((item) => <PropertyCard key={item.id} property={item} />)}
            </div>
          </div>
        ) : null}
      </div>
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="mb-5 rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.06em] text-[var(--muted)]">Landlord</p>
          <h2 className="mt-2 text-[20px] font-extrabold">{property.agent}</h2>
          <p className="mt-2 text-[13px] font-semibold leading-[1.6] text-[var(--muted)]">Verified housing partner for {property.university} students.</p>
        </div>
        <ContactForm title={`Ask about ${property.name}`} property={property} />
      </aside>
    </section>
  );
}
