import { assets } from "@/lib/assets";
import { resolvePropertyImageUrls } from "@/lib/property-images";
import { formatKgs, WHATSAPP_PHONE } from "@/lib/property-utils";
import type { City, Property, Region, University } from "@/types/property";

type DbUniversity = {
  id: string;
  name: string;
  short_name: string | null;
  city: string;
  region: string;
  description: string | null;
  image_url: string | null;
};

type DbPropertyImage = {
  image_url: string;
  sort_order: number;
};

export type DbProperty = {
  id: string;
  title: string;
  slug: string;
  description: string;
  monthly_rent: number;
  currency: string;
  location: string;
  region: string;
  nearby_university_id: string | null;
  distance_from_university: string | null;
  room_type: "Studio" | "Private room" | "Shared room" | "Apartment";
  shared_room: boolean;
  furnished: boolean;
  utilities_included: boolean;
  gender_preference: "Female only" | "Male only" | "Mixed";
  amenities: string[] | null;
  roommate_count: number;
  verified: boolean;
  featured: boolean;
  featured_rank: number;
  listing_status: "active" | "draft" | "unavailable";
  available_from: string | null;
  whatsapp_number: string | null;
  universities?: DbUniversity | null;
  property_images?: DbPropertyImage[] | null;
};

export function mapDbUniversity(row: DbUniversity & { apartment_count?: number; average_rent?: number; nearby_listings?: number }): University {
  const shortName = row.short_name ? ` (${row.short_name})` : "";
  return {
    slug: row.short_name?.toLowerCase() ?? row.id,
    name: `${row.name}${shortName}`,
    city: row.city,
    apartmentCount: row.apartment_count ?? 0,
    averageRent: row.average_rent ? formatKgs(row.average_rent) : "Soon",
    nearbyListings: row.nearby_listings ?? 0
  };
}

export function mapDbRegion(row: { id: string; name: string; is_active: boolean; coming_soon: boolean }): Region {
  return {
    slug: row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    name: row.name,
    status: row.is_active && !row.coming_soon ? "active" : "coming-soon"
  };
}

export function regionToCity(region: Region, count = 0, averageRent = "Soon"): City {
  return {
    slug: region.slug,
    name: region.name,
    count,
    averageRent,
    status: region.status
  };
}

export function mapDbProperty(row: DbProperty): Property {
  const imageUrls = [...(row.property_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => image.image_url);
  const images = resolvePropertyImageUrls(imageUrls);
  const firstImage = images[0] ?? assets.property1;
  const universityName = row.universities
    ? `${row.universities.name}${row.universities.short_name ? ` (${row.universities.short_name})` : ""}`
    : "Nearby university";

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    name: row.title,
    price: formatKgs(row.monthly_rent),
    priceMonthly: row.monthly_rent,
    location: row.location,
    city: row.region,
    region: row.region,
    university: universityName,
    distance: row.distance_from_university ?? "Near campus",
    roommates: row.roommate_count,
    roomType: row.room_type,
    furnished: row.furnished,
    utilitiesIncluded: row.utilities_included,
    badges: [
      row.utilities_included ? "Bills Included" : "Bills Separate",
      row.furnished ? "Fully Furnished" : "Unfurnished",
      row.gender_preference
    ],
    amenities: row.amenities ?? [],
    availabilityDate: row.available_from ?? "Available now",
    image: firstImage,
    images,
    popular: row.featured,
    verified: row.verified,
    genderPreference: row.gender_preference,
    type: row.room_type === "Studio" ? "Studio" : row.room_type === "Apartment" ? "Apartment" : "Shared Room",
    agent: "Verified landlord",
    landlordPhone: row.whatsapp_number ?? `+${WHATSAPP_PHONE}`,
    description: row.description,
    status: row.listing_status
  };
}
