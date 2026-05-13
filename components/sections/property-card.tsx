"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Heart, MapPin, MessageCircle, Sofa, Sparkles, Users, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import type { Property } from "@/types/property";
import { Card } from "@/components/ui/card";
import { PropertyImage } from "@/components/ui/property-image";
import { getWhatsAppHref } from "@/lib/property-utils";
import { useAdminSettings } from "@/hooks/use-admin-settings";
import { useSavedProperties } from "@/hooks/use-saved-properties";

export function PropertyCard({ property, compact = false, priority = false }: { property: Property; compact?: boolean; priority?: boolean }) {
  const router = useRouter();
  const { whatsAppPhone } = useAdminSettings();
  const { isSaved, toggleSaved } = useSavedProperties();
  const saved = isSaved(property.id);
  const propertyHref = `/properties/${property.slug}`;

  return (
    <motion.div whileHover={{ y: compact ? -2 : -4 }} transition={{ duration: 0.22 }}>
      <Card
        className={compact ? "relative h-[304px] cursor-pointer overflow-hidden border-[var(--primary)]" : "relative min-h-[506px] cursor-pointer overflow-hidden"}
        role="link"
        tabIndex={0}
        aria-label={`View ${property.name}`}
        onClick={() => router.push(propertyHref)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            router.push(propertyHref);
          }
        }}
      >
        <Link href={propertyHref} aria-label={`View ${property.name}`} className="block">
          <div className={compact ? "h-[134px] overflow-hidden p-1.5" : "h-[202px] overflow-hidden p-2"}>
            <PropertyImage
              src={property.image}
              alt={property.name}
              width={compact ? 380 : 704}
              height={compact ? 240 : 400}
              sizes={compact ? "198px" : "(min-width: 1280px) 352px, (min-width: 768px) 50vw, 100vw"}
              priority={priority}
              className="h-full w-full rounded-[14px] object-cover transition duration-500 hover:scale-105"
            />
          </div>
        </Link>
        {property.popular && !compact ? (
          <div className="pointer-events-none absolute left-4 top-4 flex h-8 items-center gap-1 rounded-full bg-[var(--primary)] px-3 text-[11px] font-semibold leading-4 tracking-[0.4px] text-white shadow-[0_10px_28px_rgba(23,166,115,0.22)]">
            <Sparkles size={13} fill="currentColor" /> STUDENT PICK
          </div>
        ) : null}
        {property.verified && !compact ? (
          <div className="pointer-events-none absolute right-4 top-4 flex h-8 items-center gap-1 rounded-full bg-white/92 px-3 text-[11px] font-semibold text-[var(--primary)] shadow-[0_8px_22px_rgba(16,32,28,0.12)] backdrop-blur">
            <BadgeCheck size={14} fill="currentColor" /> Verified
          </div>
        ) : null}
        <button
          className={compact ? "focus-ring absolute right-4 top-[152px] flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] transition hover:bg-[var(--surface)]" : "focus-ring absolute right-5 top-[222px] flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] transition hover:bg-[var(--surface)] sm:right-6 sm:h-12 sm:w-12"}
          aria-label={saved ? `Remove ${property.name} from saved apartments` : `Save ${property.name}`}
          aria-pressed={saved}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            void toggleSaved(property.id);
          }}
        >
          <Heart size={compact ? 18 : 22} fill={saved ? "currentColor" : "none"} />
        </button>
        <div className={compact ? "p-4 pt-3" : "p-5 pt-4 sm:p-6 sm:pt-5"}>
          <p className={compact ? "text-[15px] font-bold leading-[1.4] text-[var(--primary)]" : "text-[22px] font-bold leading-[1.35] text-[var(--primary)]"}>
            {property.price}
            <span className={compact ? "ml-1 text-[11px] font-medium text-[var(--muted)]" : "ml-1 text-[13px] font-medium text-[var(--muted)]"}>/month</span>
          </p>
          <h3 className={compact ? "mt-1 text-[14px] font-semibold leading-[1.35]" : "mt-2 text-[19px] font-semibold leading-[1.35]"}>
            {property.name}
          </h3>
          <p className={compact ? "mt-1 flex items-center gap-1.5 text-[11px] font-normal leading-[1.35] text-[var(--muted)]" : "mt-2 flex items-center gap-1.5 text-[13px] font-normal leading-[1.5] text-[var(--muted)]"}>
            <MapPin size={compact ? 13 : 15} /> {property.distance}
          </p>
          <div className={compact ? "my-3 h-px bg-[var(--border)]" : "my-4 h-px bg-[var(--border)]"} />
          <div className={compact ? "grid grid-cols-2 gap-2 text-[11px] font-medium text-[var(--muted-strong)]" : "grid grid-cols-2 gap-2 text-[12px] font-medium text-[var(--muted-strong)] sm:gap-3"}>
            <span className="flex min-w-0 items-center gap-1.5">
              <Users size={compact ? 14 : 17} color="var(--primary)" /> {property.roommates} roommates
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <Sofa size={compact ? 14 : 17} color="var(--primary)" /> {property.furnished ? "Furnished" : "Unfurnished"}
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <Wifi size={compact ? 14 : 17} color="var(--primary)" /> {property.utilitiesIncluded ? "Bills included" : "Bills separate"}
            </span>
            <span className="truncate rounded-full bg-[var(--surface)] px-2 py-1 text-center text-[var(--primary)]">{property.roomType}</span>
          </div>
          {!compact ? <div className="mt-4 flex flex-wrap gap-2">{property.badges.slice(0, 3).map((badge) => <span key={badge} className="rounded-full bg-[var(--surface)] px-3 py-1 text-[11px] font-medium text-[var(--muted-strong)]">{badge}</span>)}</div> : null}
          {!compact ? (
            <a
              href={getWhatsAppHref(property, "interested in", whatsAppPhone)}
              target="_blank"
              rel="noreferrer"
              className="focus-ring mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[var(--primary)] px-4 text-[13px] font-normal text-white transition hover:-translate-y-0.5 hover:bg-[var(--primary-light)]"
              onClick={(event) => event.stopPropagation()}
            >
              <MessageCircle size={17} /> Contact Landlord
            </a>
          ) : null}
        </div>
      </Card>
    </motion.div>
  );
}
