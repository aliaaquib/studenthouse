import type { Property, PropertyFilters } from "@/types/property";

export const WHATSAPP_PHONE = "996555011697";

export const defaultFilters: PropertyFilters = {
  query: "",
  budget: "Any",
  roomType: "Any",
  furnished: "Any",
  utilities: "Any",
  genderPreference: "Any",
  university: "Any",
  region: "Any"
};

export function formatKgs(amount: number) {
  return `${new Intl.NumberFormat("en-US").format(amount)} сом`;
}

export function getWhatsAppHref(property: Property, intent = "interested in") {
  const message = `Hi, I'm ${intent} the apartment '${property.title}' listed on your student housing platform. Location: ${property.location}. Monthly rent: ${property.price}. Property ID: ${property.id}. Please share more details.`;

  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

export function filterProperties(properties: Property[], filters: PropertyFilters) {
  const query = filters.query.trim().toLowerCase();

  return properties.filter((property) => {
    const matchesQuery = !query || [property.title, property.location, property.city, property.region, property.university, property.id]
      .join(" ")
      .toLowerCase()
      .includes(query);

    const matchesBudget =
      filters.budget === "Any" ||
      (filters.budget === "Under 15,000 KGS" && property.priceMonthly < 15000) ||
      (filters.budget === "15,000 - 22,000 KGS" && property.priceMonthly >= 15000 && property.priceMonthly <= 22000) ||
      (filters.budget === "22,000+ KGS" && property.priceMonthly > 22000);

    const matchesRoom = filters.roomType === "Any" || property.roomType === filters.roomType;
    const matchesFurnished = filters.furnished === "Any" || (filters.furnished === "Furnished" ? property.furnished : !property.furnished);
    const matchesUtilities = filters.utilities === "Any" || (filters.utilities === "Included" ? property.utilitiesIncluded : !property.utilitiesIncluded);
    const matchesGender = filters.genderPreference === "Any" || property.genderPreference === filters.genderPreference;
    const matchesUniversity = filters.university === "Any" || property.university === filters.university;
    const matchesRegion = filters.region === "Any" || property.region === filters.region;

    return matchesQuery && matchesBudget && matchesRoom && matchesFurnished && matchesUtilities && matchesGender && matchesUniversity && matchesRegion;
  });
}
