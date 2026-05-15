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

export type SmartSearchResult = {
  properties: Property[];
  mode: "default" | "exact" | "nearby" | "recommended" | "none";
  normalizedQuery: string;
  displayQuery: string;
  nearbyLabel: string | null;
};

const SEARCH_STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "in",
  "near",
  "at",
  "for",
  "to",
  "of",
  "student",
  "students",
  "housing",
  "home",
  "homes",
  "rent",
  "rental",
  "rentals",
  "flat",
  "flats",
  "place"
]);

const SEARCH_INTENT_ALIASES: Record<string, string[]> = {
  apartment: ["apartment", "apartments", "apt"],
  house: ["house", "houses"],
  room: ["room", "rooms"],
  hostel: ["hostel", "hostels"],
  shared: ["shared", "roommate", "roommates"]
};

const NEARBY_LOCATION_MAP: Record<string, string[]> = {
  sputnik: ["Jalal-Abad", "JAIU", "JASU", "CAIMU"],
  "jalal abad": ["Jalal-Abad", "JAIU", "JASU", "CAIMU"],
  jalalabad: ["Jalal-Abad", "JAIU", "JASU", "CAIMU"],
  caimu: ["CAIMU", "Jalal-Abad"],
  jaiu: ["JAIU", "Jalal-Abad"],
  jasu: ["JASU", "Jalal-Abad"]
};

function normalizeSearchValue(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandSearchAliases(query: string) {
  const normalized = normalizeSearchValue(query);
  const expansions = new Set<string>([normalized]);

  Object.entries(SEARCH_INTENT_ALIASES).forEach(([key, aliases]) => {
    if (aliases.some((alias) => normalized.includes(alias))) {
      expansions.add(key);
      aliases.forEach((alias) => expansions.add(alias));
    }
  });

  Object.entries(NEARBY_LOCATION_MAP).forEach(([key, nearbyValues]) => {
    if (normalized.includes(key)) {
      expansions.add(key);
      nearbyValues.forEach((value) => expansions.add(normalizeSearchValue(value)));
    }
  });

  return Array.from(expansions);
}

function extractSearchTokens(query: string) {
  return normalizeSearchValue(query)
    .split(" ")
    .filter(Boolean)
    .filter((token) => !SEARCH_STOP_WORDS.has(token));
}

function inferRoomType(query: string): PropertyFilters["roomType"] {
  const normalized = normalizeSearchValue(query);
  if (normalized.includes("shared room") || normalized.includes("shared")) return "Shared room";
  if (normalized.includes("private room")) return "Private room";
  if (normalized.includes("studio")) return "Studio";
  if (normalized.includes("apartment") || normalized.includes("house")) return "Apartment";
  return "Any";
}

function buildPropertySearchText(property: Property) {
  return normalizeSearchValue([
    property.title,
    property.name,
    property.location,
    property.city,
    property.region,
    property.university,
    property.description,
    property.roomType,
    property.type,
    property.id,
    ...property.badges,
    ...property.amenities
  ].join(" "));
}

function scorePropertyMatch(property: Property, query: string, tokens: string[], expandedTerms: string[]) {
  const searchText = buildPropertySearchText(property);
  let score = 0;

  if (!query) return score;

  if (searchText.includes(query)) {
    score += 120;
  }

  tokens.forEach((token) => {
    if (searchText.includes(token)) {
      score += 24;
      if (normalizeSearchValue(property.location).includes(token)) score += 22;
      if (normalizeSearchValue(property.region).includes(token)) score += 18;
      if (normalizeSearchValue(property.university).includes(token)) score += 18;
      if (normalizeSearchValue(property.title).includes(token)) score += 14;
    }
  });

  expandedTerms.forEach((term) => {
    if (term !== query && searchText.includes(term)) {
      score += 10;
    }
  });

  return score;
}

function sortSearchResults(properties: Property[], scores: Map<string, number>) {
  return [...properties].sort((a, b) => {
    const scoreDiff = (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    if (Boolean(b.popular) !== Boolean(a.popular)) return Number(Boolean(b.popular)) - Number(Boolean(a.popular));
    return a.priceMonthly - b.priceMonthly;
  });
}

export function formatKgs(amount: number) {
  return `${new Intl.NumberFormat("en-US").format(amount)} сом`;
}

export function normalizeWhatsAppPhone(phone: string) {
  const normalized = phone.replace(/[^\d]/g, "");
  return normalized || WHATSAPP_PHONE;
}

export function getWhatsAppHref(property: Property, intent = "interested in", phone = WHATSAPP_PHONE) {
  const message = `Hi, I'm ${intent} the apartment '${property.title}' listed on your student housing platform. Location: ${property.location}. Monthly rent: ${property.price}. Property ID: ${property.id}. Please share more details.`;

  return `https://wa.me/${normalizeWhatsAppPhone(phone)}?text=${encodeURIComponent(message)}`;
}

function applyStructuredFilters(properties: Property[], filters: PropertyFilters) {
  const inferredRoomType = filters.roomType === "Any" ? inferRoomType(filters.query) : filters.roomType;

  return properties.filter((property) => {
    const matchesBudget =
      filters.budget === "Any" ||
      (filters.budget === "Under 15,000 KGS" && property.priceMonthly < 15000) ||
      (filters.budget === "15,000 - 22,000 KGS" && property.priceMonthly >= 15000 && property.priceMonthly <= 22000) ||
      (filters.budget === "22,000+ KGS" && property.priceMonthly > 22000);

    const matchesRoom = inferredRoomType === "Any" || property.roomType === inferredRoomType;
    const matchesFurnished = filters.furnished === "Any" || (filters.furnished === "Furnished" ? property.furnished : !property.furnished);
    const matchesUtilities = filters.utilities === "Any" || (filters.utilities === "Included" ? property.utilitiesIncluded : !property.utilitiesIncluded);
    const matchesGender = filters.genderPreference === "Any" || property.genderPreference === filters.genderPreference;
    const matchesUniversity = filters.university === "Any" || property.university === filters.university;
    const matchesRegion = filters.region === "Any" || property.region === filters.region;

    return matchesBudget && matchesRoom && matchesFurnished && matchesUtilities && matchesGender && matchesUniversity && matchesRegion;
  });
}

export function smartSearchProperties(properties: Property[], filters: PropertyFilters): SmartSearchResult {
  const structuredMatches = applyStructuredFilters(properties, filters);
  const normalizedQuery = normalizeSearchValue(filters.query);
  const displayQuery = filters.query.trim();

  if (!normalizedQuery) {
    return {
      properties: structuredMatches,
      mode: "default",
      normalizedQuery,
      displayQuery,
      nearbyLabel: null
    };
  }

  const tokens = extractSearchTokens(filters.query);
  const expandedTerms = expandSearchAliases(filters.query);
  const exactScores = new Map<string, number>();
  const exactMatches = structuredMatches.filter((property) => {
    const score = scorePropertyMatch(property, normalizedQuery, tokens, expandedTerms);
    if (score > 0) {
      exactScores.set(property.id, score);
      return true;
    }
    return false;
  });

  if (exactMatches.length > 0) {
    return {
      properties: sortSearchResults(exactMatches, exactScores),
      mode: "exact",
      normalizedQuery,
      displayQuery,
      nearbyLabel: null
    };
  }

  const nearbyTerms = Array.from(new Set(expandedTerms.flatMap((term) => NEARBY_LOCATION_MAP[term] ?? [])));
  if (nearbyTerms.length > 0) {
    const nearbyScores = new Map<string, number>();
    const nearbyMatches = structuredMatches.filter((property) => {
      const score = nearbyTerms.reduce((total, term) => {
        const normalizedTerm = normalizeSearchValue(term);
        return total + (buildPropertySearchText(property).includes(normalizedTerm) ? 20 : 0);
      }, 0);

      if (score > 0) {
        nearbyScores.set(property.id, score + (property.popular ? 5 : 0));
        return true;
      }
      return false;
    });

    if (nearbyMatches.length > 0) {
      return {
        properties: sortSearchResults(nearbyMatches, nearbyScores),
        mode: "nearby",
        normalizedQuery,
        displayQuery,
        nearbyLabel: nearbyTerms.join(", ")
      };
    }
  }

  if (structuredMatches.length > 0) {
    const recommendedScores = new Map(structuredMatches.map((property) => [property.id, property.popular ? 10 : 0]));
    return {
      properties: sortSearchResults(structuredMatches, recommendedScores),
      mode: "recommended",
      normalizedQuery,
      displayQuery,
      nearbyLabel: null
    };
  }

  return {
    properties: [],
    mode: "none",
    normalizedQuery,
    displayQuery,
    nearbyLabel: null
  };
}

export function filterProperties(properties: Property[], filters: PropertyFilters) {
  return smartSearchProperties(properties, filters).properties;
}
