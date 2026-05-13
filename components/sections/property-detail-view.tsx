"use client";

import Link from "next/link";
import { ArrowLeft, BadgeCheck, CalendarDays, Heart, MapPin, MessageCircle, PlayCircle, Sofa, Users, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ContactForm } from "@/components/sections/contact-form";
import { PropertyCard } from "@/components/sections/property-card";
import { PropertyImage } from "@/components/ui/property-image";
import { Button } from "@/components/ui/button";
import { trackPropertyViewAction } from "@/lib/actions/user-data";
import { getWhatsAppHref } from "@/lib/property-utils";
import { useAdminSettings } from "@/hooks/use-admin-settings";
import { useSavedProperties } from "@/hooks/use-saved-properties";
import type { Property } from "@/types/property";

const tourItems = [
  { icon: PlayCircle, title: "Virtual tour", copy: "Preview the room remotely" },
  { icon: CalendarDays, title: "Visit slots", copy: "Weekday and weekend times" },
  { icon: BadgeCheck, title: "Verified host", copy: "Student-safe listing checks" }
];

export function PropertyDetailView({ property, similarProperties }: { property: Property; similarProperties: Property[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { whatsAppPhone } = useAdminSettings();
  const { isSaved, toggleSaved } = useSavedProperties();
  const saved = isSaved(property.id);
  const activeImage = property.images[activeIndex] ?? property.images[0];

  useEffect(() => {
    void trackPropertyViewAction(property.id);
  }, [property.id]);

  function showImage(index: number) {
    setActiveIndex(index);
  }

  function stepImage(direction: "prev" | "next") {
    setActiveIndex((current) => {
      const delta = direction === "next" ? 1 : -1;
      return (current + delta + property.images.length) % property.images.length;
    });
  }

  return (
    <section className="section-frame grid gap-10 py-12 lg:grid-cols-[1fr_372px]">
      <div>
        <Button asChild variant="outline" className="mb-6 w-fit">
          <Link href="/properties" aria-label="Go back to all properties">
            <ArrowLeft size={17} /> Back
          </Link>
        </Button>
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <button type="button" className="focus-ring overflow-hidden rounded-[20px]" onClick={() => setPreviewOpen(true)} aria-label="Open fullscreen gallery">
            <motion.div key={activeImage} initial={{ opacity: 0.72 }} animate={{ opacity: 1 }}>
              <PropertyImage
                src={activeImage}
                alt={property.name}
                width={900}
                height={520}
                priority
                sizes="(min-width: 1024px) 720px, 100vw"
                className="h-[260px] w-full rounded-[20px] object-cover sm:h-[360px] lg:h-[430px]"
              />
            </motion.div>
          </button>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
            {property.images.slice(1, 3).map((image, index) => (
              <button key={image} type="button" className="focus-ring overflow-hidden rounded-[20px]" onClick={() => showImage(index + 1)}>
                <PropertyImage
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
            <p className="mt-3 flex items-center gap-2 text-[15px] font-normal text-[var(--muted)]">
              <MapPin size={18} /> {property.location} · {property.distance}
            </p>
            <p className="mt-2 text-[13px] font-medium text-[var(--muted)]">Property ID: {property.id} · Available {property.availabilityDate}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            <Button type="button" variant="outline" onClick={() => toggleSaved(property.id)}>
              <Heart size={18} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save apartment"}
            </Button>
            <Button asChild>
              <a href={getWhatsAppHref(property, "requesting a booking for", whatsAppPhone)} target="_blank" rel="noreferrer">
                <MessageCircle size={18} /> Book Visit
              </a>
            </Button>
          </div>
        </div>
        <div className="mt-8 grid gap-4 border-y border-[var(--border)] py-6 sm:grid-cols-4">
          <span className="flex items-center gap-3 text-[14px] font-medium"><Users color="var(--primary)" /> {property.roommates} roommates</span>
          <span className="flex items-center gap-3 text-[14px] font-medium"><Sofa color="var(--primary)" /> {property.furnished ? "Furnished" : "Unfurnished"}</span>
          <span className="flex items-center gap-3 text-[14px] font-medium"><Wifi color="var(--primary)" /> {property.utilitiesIncluded ? "Bills included" : "Bills separate"}</span>
          <span className="flex items-center gap-3 text-[14px] font-medium"><BadgeCheck color="var(--primary)" /> Verified</span>
        </div>
        <p className="mt-8 max-w-[760px] text-[15px] font-normal leading-[1.75] text-[var(--muted)]">{property.description}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {property.badges.map((badge) => (
            <span key={badge} className="rounded-full bg-[var(--surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--muted-strong)]">{badge}</span>
          ))}
        </div>
        <div className="mt-10 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-[20px] font-semibold leading-[1.35]">Amenities</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {property.amenities.map((amenity) => (
              <span key={amenity} className="rounded-[14px] bg-[var(--surface)] px-4 py-3 text-[13px] font-medium text-[var(--muted-strong)]">{amenity}</span>
            ))}
          </div>
        </div>
        <div className="mt-10 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-[20px] font-semibold leading-[1.35]">Virtual tour and booking</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {tourItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[16px] bg-[var(--surface)] p-4">
                  <Icon color="var(--primary)" />
                  <strong className="mt-3 block text-[14px] font-semibold">{item.title}</strong>
                  <span className="mt-1 block text-[12px] font-normal leading-[1.6] text-[var(--muted)]">{item.copy}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-10 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-[20px] font-semibold leading-[1.35]">Nearby university</h2>
          <p className="mt-3 text-[15px] font-normal leading-[1.7] text-[var(--muted)]">
            {property.university} is {property.distance.toLowerCase()}, with student-friendly transit, grocery access, and verified landlord support nearby.
          </p>
        </div>
        {similarProperties.length > 0 ? (
          <div className="mt-12">
            <h2 className="text-[22px] font-semibold leading-[1.4]">Similar apartments</h2>
            <div className="mt-6 grid gap-8 md:grid-cols-2">
              {similarProperties.map((item) => <PropertyCard key={item.id} property={item} />)}
            </div>
          </div>
        ) : null}
      </div>
      <aside className="lg:self-start">
        <div className="lg:sticky lg:top-28">
        <ContactForm title={`Ask about ${property.name}`} property={property} />
        </div>
      </aside>
      {previewOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <button type="button" className="focus-ring absolute right-4 top-4 rounded-full bg-white/10 px-3 py-2 text-sm text-white" onClick={() => setPreviewOpen(false)}>Close</button>
          {property.images.length > 1 ? (
            <>
              <button type="button" className="focus-ring absolute left-4 rounded-full bg-white/10 px-3 py-2 text-sm text-white" onClick={() => stepImage("prev")}>Prev</button>
              <button type="button" className="focus-ring absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-sm text-white" onClick={() => stepImage("next")}>Next</button>
            </>
          ) : null}
          <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4">
            <PropertyImage
              src={activeImage}
              alt={property.name}
              width={1200}
              height={800}
              sizes="100vw"
              className="max-h-[78vh] w-full rounded-[24px] object-contain"
            />
            <div className="flex gap-3 overflow-x-auto">
              {property.images.map((image, index) => (
                <button key={`${image}-${index}`} type="button" className={`focus-ring overflow-hidden rounded-[16px] border ${index === activeIndex ? "border-white" : "border-white/20"}`} onClick={() => showImage(index)}>
                  <PropertyImage src={image} alt="" width={110} height={80} className="h-20 w-28 object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
