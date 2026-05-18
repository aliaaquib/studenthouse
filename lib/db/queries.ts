import { unstable_cache } from "next/cache";
import { defaultAdminSettings, mapPlatformSettingsRow } from "@/lib/admin-settings";
import { getCurrentSession, type AppUserSession } from "@/lib/auth/guards";
import { mapDbProperty, mapDbRegion, mapDbUniversity, regionToCity, type DbProperty } from "@/lib/db/mappers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { City, Property, PropertyFilters, Region, University } from "@/types/property";

const propertySelect = `
  *,
  universities:nearby_university_id (
    id,
    name,
    short_name,
    city,
    region,
    description,
    image_url
  ),
  property_images (
    image_url,
    sort_order
  )
`;

type PlatformSettingsRow = {
  whatsapp_number: string | null;
  brand: string | null;
  currency: string | null;
  homepage_text: string | null;
};

type UniversityDbRow = {
  id: string;
  name: string;
  short_name: string | null;
  city: string;
  region: string;
  description: string | null;
  image_url: string | null;
};

type RegionDbRow = {
  id: string;
  name: string;
  is_active: boolean;
  coming_soon: boolean;
  created_at: string;
};

type InquiryRow = {
  id: string;
  property_id: string | null;
  message: string;
  whatsapp_number: string;
  created_at: string;
  properties: { title: string } | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string;
  role: "admin" | "agent" | "student";
  created_at: string;
};

type SearchHistoryRow = {
  id: string;
  query: string | null;
  region: string | null;
  university: string | null;
  room_type: string | null;
  created_at: string;
};

type RecentViewRow = {
  property_id: string;
  viewed_at: string;
};

function groupUniversityMetrics(properties: Property[]) {
  const map = new Map<string, { count: number; total: number }>();

  for (const property of properties) {
    const current = map.get(property.university) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += property.priceMonthly;
    map.set(property.university, current);
  }

  return map;
}

function groupRegionMetrics(properties: Property[]) {
  const map = new Map<string, { count: number; total: number }>();

  for (const property of properties) {
    const current = map.get(property.region) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += property.priceMonthly;
    map.set(property.region, current);
  }

  return map;
}

async function findUniversityIdByName(universityName: string) {
  const supabase = getSupabasePublicClient() ?? await createSupabaseServerClient();
  if (!supabase) return null;

  const bareName = universityName.replace(/\s+\([^)]+\)$/, "");
  const shortName = /\(([^)]+)\)$/.exec(universityName)?.[1];

  const { data } = await supabase
    .from("universities")
    .select("id")
    .or([
      `name.eq.${bareName}`,
      shortName ? `short_name.eq.${shortName}` : ""
    ].filter(Boolean).join(","))
    .maybeSingle();

  return data?.id ?? null;
}

const getCachedPublicPropertyRows = unstable_cache(
  async () => {
    const supabase = getSupabasePublicClient();
    if (!supabase) return [] as DbProperty[];

    const { data, error } = await supabase
      .from("properties")
      .select(propertySelect)
      .eq("verified", true)
      .eq("listing_status", "active")
      .order("featured", { ascending: false })
      .order("featured_rank", { ascending: true })
      .order("created_at", { ascending: false });

    if (error || !data) return [] as DbProperty[];
    return data as DbProperty[];
  },
  ["public-properties"],
  { revalidate: 120, tags: ["public-properties"] }
);

const getCachedMappedPublicProperties = unstable_cache(
  async () => {
    const rows = await getCachedPublicPropertyRows();
    return rows.map(mapDbProperty);
  },
  ["public-properties-mapped"],
  { revalidate: 120, tags: ["public-properties"] }
);

function applyPublicPropertyFilters(properties: Property[], filters?: Partial<PropertyFilters>) {
  if (!filters) return properties;

  return properties.filter((property) => {
    const matchesRegion = !filters.region || filters.region === "Any" || property.region === filters.region;
    const matchesRoom = !filters.roomType || filters.roomType === "Any" || property.roomType === filters.roomType;
    const matchesFurnished =
      !filters.furnished ||
      filters.furnished === "Any" ||
      (filters.furnished === "Furnished" ? property.furnished : !property.furnished);
    const matchesUtilities =
      !filters.utilities ||
      filters.utilities === "Any" ||
      (filters.utilities === "Included" ? property.utilitiesIncluded : !property.utilitiesIncluded);
    const matchesGender =
      !filters.genderPreference || filters.genderPreference === "Any" || property.genderPreference === filters.genderPreference;
    const matchesBudget =
      !filters.budget ||
      filters.budget === "Any" ||
      (filters.budget === "Under 15,000 KGS" && property.priceMonthly < 15000) ||
      (filters.budget === "15,000 - 22,000 KGS" && property.priceMonthly >= 15000 && property.priceMonthly <= 22000) ||
      (filters.budget === "22,000+ KGS" && property.priceMonthly > 22000);

    return matchesRegion && matchesRoom && matchesFurnished && matchesUtilities && matchesGender && matchesBudget;
  });
}

export async function getPublicProperties(filters?: Partial<PropertyFilters>): Promise<Property[]> {
  const [rows, baseProperties] = await Promise.all([
    getCachedPublicPropertyRows(),
    getCachedMappedPublicProperties()
  ]);
  const rowById = new Map(rows.map((row) => [row.id, row]));
  let properties = baseProperties;

  if (filters?.university && filters.university !== "Any") {
    const universityId = await findUniversityIdByName(filters.university);
    if (universityId) {
      properties = properties.filter((property) => {
        const row = property.id ? rowById.get(property.id) : undefined;
        return row?.nearby_university_id === universityId;
      });
    }
  }

  properties = applyPublicPropertyFilters(properties, filters);

  if (filters?.query?.trim()) {
    const term = filters.query.trim().toLowerCase();
    properties = properties.filter((property) =>
      [
        property.title,
        property.location,
        property.region,
        property.description,
        property.university
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }

  return properties;
}

export async function getAdminProperties(): Promise<Property[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("properties")
    .select(propertySelect)
    .order("featured", { ascending: false })
    .order("featured_rank", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as DbProperty[]).map(mapDbProperty);
}

export async function getManagedProperties(session: Pick<AppUserSession, "id" | "role">): Promise<Property[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  let query = supabase
    .from("properties")
    .select(propertySelect)
    .order("featured", { ascending: false })
    .order("featured_rank", { ascending: true })
    .order("created_at", { ascending: false });

  if (session.role === "agent") {
    query = query.eq("created_by", session.id);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as DbProperty[]).map(mapDbProperty);
}

export async function getPropertyBySlug(slug: string) {
  const rows = await getCachedPublicPropertyRows();
  const row = rows.find((item) => item.slug === slug);
  return row ? mapDbProperty(row) : null;
}

const getCachedUniversityRows = unstable_cache(
  async () => {
    const supabase = getSupabasePublicClient();
    if (!supabase) return [] as UniversityDbRow[];
    const { data, error } = await supabase.from("universities").select("*").order("name");
    if (error || !data) return [] as UniversityDbRow[];
    return data as UniversityDbRow[];
  },
  ["universities"],
  { revalidate: 300, tags: ["universities"] }
);

export async function getUniversities(): Promise<University[]> {
  const [universityRows, properties] = await Promise.all([
    getCachedUniversityRows(),
    getPublicProperties()
  ]);

  const metrics = groupUniversityMetrics(properties);
  const uniqueRows = universityRows.filter((row, index, rows) => {
    const identity = (row.short_name || row.name).trim().toLowerCase();
    return rows.findIndex((candidate) => ((candidate.short_name || candidate.name).trim().toLowerCase() === identity)) === index;
  });

  return uniqueRows.map((row) => {
    const shortName = row.short_name ? ` (${row.short_name})` : "";
    const key = `${row.name}${shortName}`;
    const summary = metrics.get(key);

    return mapDbUniversity({
      ...row,
      apartment_count: summary?.count ?? 0,
      average_rent: summary?.count ? Math.round(summary.total / summary.count) : undefined,
      nearby_listings: summary?.count ?? 0
    });
  });
}

const getCachedRegionRows = unstable_cache(
  async () => {
    const supabase = getSupabasePublicClient();
    if (!supabase) return [] as RegionDbRow[];
    const { data, error } = await supabase.from("regions").select("*").order("created_at");
    if (error || !data) return [] as RegionDbRow[];
    return data as RegionDbRow[];
  },
  ["regions"],
  { revalidate: 300, tags: ["regions"] }
);

const getCachedPlatformSettings = unstable_cache(
  async () => {
    const supabase = getSupabasePublicClient();
    if (!supabase) return null;
    const { data } = await supabase
      .from("platform_settings")
      .select("whatsapp_number, brand, currency, homepage_text")
      .eq("id", 1)
      .maybeSingle();
    return data as PlatformSettingsRow | null;
  },
  ["platform-settings"],
  { revalidate: 300, tags: ["platform-settings"] }
);

export async function getRegions(): Promise<{ activeRegions: Region[]; comingSoonRegions: Region[]; cities: City[] }> {
  const [data, properties] = await Promise.all([getCachedRegionRows(), getPublicProperties()]);

  const regions = data
    .map(mapDbRegion)
    .filter((region) => region.name !== "Manas");
  const activeRegions = regions.filter((region) => region.status === "active");
  const comingSoonRegions = regions.filter((region) => region.status === "coming-soon");
  const regionMetrics = groupRegionMetrics(properties);

  return {
    activeRegions,
    comingSoonRegions,
    cities: regions.map((region) => {
      const summary = regionMetrics.get(region.name);
      return regionToCity(
        region,
        summary?.count ?? 0,
        summary?.count ? `${Math.round(summary.total / summary.count).toLocaleString("en-US")} сом` : "Soon"
      );
    })
  };
}

export async function getPlatformSettings() {
  const settings = await getCachedPlatformSettings();
  return settings ? mapPlatformSettingsRow(settings) : defaultAdminSettings;
}

export async function getCurrentFavoriteIds() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) return [];

  const { data } = await supabase
    .from("favorites")
    .select("property_id")
    .eq("user_id", userResult.user.id);

  return (data ?? []).map((item) => item.property_id);
}

export async function getFavoritePropertiesForCurrentUser() {
  const favoriteIds = await getCurrentFavoriteIds();
  if (!favoriteIds.length) return [] as Property[];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [] as Property[];

  const { data, error } = await supabase
    .from("properties")
    .select(propertySelect)
    .in("id", favoriteIds)
    .order("created_at", { ascending: false });

  if (error || !data) return [] as Property[];

  const mapped = (data as DbProperty[]).map(mapDbProperty);
  const order = new Map(favoriteIds.map((id, index) => [id, index]));
  return mapped.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function getStudentDashboardData() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      savedProperties: [] as Property[],
      inquiryHistory: [] as string[],
      recentSearches: [] as string[],
      viewedProperties: [] as Property[],
      profile: null as { fullName: string | null; email: string } | null
    };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      savedProperties: [] as Property[],
      inquiryHistory: [] as string[],
      recentSearches: [] as string[],
      viewedProperties: [] as Property[],
      profile: null as { fullName: string | null; email: string } | null
    };
  }

  const [savedProperties, inquiriesResult, searchesResult, recentViewsResult] = await Promise.all([
    getFavoritePropertiesForCurrentUser(),
    supabase
      .from("inquiries")
      .select("message, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("search_history")
      .select("id, query, region, university, room_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("recent_views")
      .select("property_id, viewed_at")
      .eq("user_id", user.id)
      .order("viewed_at", { ascending: false })
      .limit(5)
  ]);

  const viewedIds = (recentViewsResult.data as RecentViewRow[] | null)?.map((item) => item.property_id) ?? [];
  let viewedProperties: Property[] = [];
  if (viewedIds.length) {
    const { data: viewedData } = await supabase
      .from("properties")
      .select(propertySelect)
      .in("id", viewedIds);

    const mappedViewed = ((viewedData as DbProperty[] | null) ?? []).map(mapDbProperty);
    const viewedOrder = new Map(viewedIds.map((id, index) => [id, index]));
    viewedProperties = mappedViewed.sort((a, b) => (viewedOrder.get(a.id) ?? 0) - (viewedOrder.get(b.id) ?? 0));
  }

  return {
    savedProperties,
    inquiryHistory: (inquiriesResult.data ?? []).map((item) => item.message),
    recentSearches: ((searchesResult.data as SearchHistoryRow[] | null) ?? []).map((item) =>
      [item.query, item.region, item.university, item.room_type].filter(Boolean).join(" · ")
    ),
    viewedProperties,
    profile: {
      fullName: user.user_metadata?.full_name ?? null,
      email: user.email ?? ""
    }
  };
}

export async function getAdminUsers() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [] as ProfileRow[];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error || !data) return [] as ProfileRow[];
  return data as ProfileRow[];
}

export async function getAdminInquiries() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [] as InquiryRow[];

  const { data, error } = await supabase
    .from("inquiries")
    .select(`
      id,
      message,
      whatsapp_number,
      created_at,
      properties:property_id ( title ),
      profiles:user_id ( full_name, email )
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [] as InquiryRow[];
  return data as unknown as InquiryRow[];
}

export async function getAdminDashboardData() {
  const supabase = getSupabaseAdminClient();
  const [properties, universities, regions, settings, users, inquiries] = await Promise.all([
    getAdminProperties(),
    getUniversities(),
    getRegions(),
    getPlatformSettings(),
    getAdminUsers(),
    getAdminInquiries()
  ]);

  let favoritesCount = 0;
  if (supabase) {
    const { count } = await supabase.from("favorites").select("id", { count: "exact", head: true });
    favoritesCount = count ?? 0;
  }

  return {
    properties,
    universities,
    activeRegions: regions.activeRegions,
    comingSoonRegions: regions.comingSoonRegions,
    settings,
    users: users.map((user) => ({
      id: user.id,
      name: user.full_name || user.email,
      email: user.email,
      role: user.role,
      status: "active",
      activity: new Date(user.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    })),
    inquiries: inquiries.map((inquiry) => ({
      id: inquiry.id,
      name: inquiry.profiles?.full_name || inquiry.profiles?.email || "Student inquiry",
      apartmentTitle: inquiry.properties?.title || "Unknown apartment",
      date: inquiry.created_at.slice(0, 10),
      whatsappNumber: inquiry.whatsapp_number
    })),
    favoritesCount
  };
}

export async function getAgentDashboardData() {
  const session = await getCurrentSession();
  if (!session) {
    return {
      session: null,
      properties: [] as Property[],
      inquiries: [] as {
        id: string;
        name: string;
        apartmentTitle: string;
        date: string;
        whatsappNumber: string;
      }[]
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { session, properties: [] as Property[], inquiries: [] as { id: string; name: string; apartmentTitle: string; date: string; whatsappNumber: string }[] };
  }

  const [properties, inquiriesResult] = await Promise.all([
    getManagedProperties(session),
    supabase
      .from("inquiries")
      .select(`
        id,
        property_id,
        message,
        whatsapp_number,
        created_at,
        properties:property_id ( title, created_by ),
        profiles:user_id ( full_name, email )
      `)
      .order("created_at", { ascending: false })
      .limit(20)
  ]);

  const managedPropertyIds = new Set(properties.map((property) => property.id));
  const rawInquiries = (inquiriesResult.data as unknown as InquiryRow[] | null) ?? [];

  return {
    session,
    properties,
    inquiries: rawInquiries
      .filter((inquiry) => Boolean(inquiry.property_id) && managedPropertyIds.has(inquiry.property_id as string))
      .map((inquiry) => ({
        id: inquiry.id,
        name: inquiry.profiles?.full_name || inquiry.profiles?.email || "Student inquiry",
        apartmentTitle: inquiry.properties?.title || "Unknown apartment",
        date: inquiry.created_at.slice(0, 10),
        whatsappNumber: inquiry.whatsapp_number
      }))
  };
}
