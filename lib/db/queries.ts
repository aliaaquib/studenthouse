import { defaultAdminSettings, mapPlatformSettingsRow } from "@/lib/admin-settings";
import { getCurrentSession, type AppUserSession } from "@/lib/auth/guards";
import { mapDbProperty, mapDbRegion, mapDbUniversity, regionToCity, type DbProperty } from "@/lib/db/mappers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
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
  const supabase = await createSupabaseServerClient();
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

export async function getPublicProperties(filters?: Partial<PropertyFilters>): Promise<Property[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  let query = supabase
    .from("properties")
    .select(propertySelect)
    .eq("verified", true)
    .eq("listing_status", "active")
    .order("featured", { ascending: false })
    .order("featured_rank", { ascending: true })
    .order("created_at", { ascending: false });

  if (filters?.region && filters.region !== "Any") {
    query = query.eq("region", filters.region);
  }

  if (filters?.roomType && filters.roomType !== "Any") {
    query = query.eq("room_type", filters.roomType);
  }

  if (filters?.furnished && filters.furnished !== "Any") {
    query = query.eq("furnished", filters.furnished === "Furnished");
  }

  if (filters?.utilities && filters.utilities !== "Any") {
    query = query.eq("utilities_included", filters.utilities === "Included");
  }

  if (filters?.genderPreference && filters.genderPreference !== "Any") {
    query = query.eq("gender_preference", filters.genderPreference);
  }

  if (filters?.budget && filters.budget !== "Any") {
    if (filters.budget === "Under 15,000 KGS") query = query.lt("monthly_rent", 15000);
    if (filters.budget === "15,000 - 22,000 KGS") query = query.gte("monthly_rent", 15000).lte("monthly_rent", 22000);
    if (filters.budget === "22,000+ KGS") query = query.gt("monthly_rent", 22000);
  }

  if (filters?.university && filters.university !== "Any") {
    const universityId = await findUniversityIdByName(filters.university);
    if (universityId) {
      query = query.eq("nearby_university_id", universityId);
    }
  }

  if (filters?.query?.trim()) {
    const term = `%${filters.query.trim()}%`;
    query = query.or(`title.ilike.${term},location.ilike.${term},region.ilike.${term},description.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as DbProperty[]).map(mapDbProperty);
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
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("properties")
    .select(propertySelect)
    .eq("slug", slug)
    .eq("verified", true)
    .eq("listing_status", "active")
    .maybeSingle();

  if (error || !data) return null;
  return mapDbProperty(data as DbProperty);
}

export async function getUniversities(): Promise<University[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const [universitiesResult, properties] = await Promise.all([
    supabase.from("universities").select("*").order("name"),
    getPublicProperties()
  ]);

  if (universitiesResult.error || !universitiesResult.data) return [];

  const metrics = groupUniversityMetrics(properties);
  const uniqueRows = universitiesResult.data.filter((row, index, rows) => {
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

export async function getRegions(): Promise<{ activeRegions: Region[]; comingSoonRegions: Region[]; cities: City[] }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { activeRegions: [], comingSoonRegions: [], cities: [] };
  }

  const { data, error } = await supabase.from("regions").select("*").order("created_at");
  if (error || !data) {
    return { activeRegions: [], comingSoonRegions: [], cities: [] };
  }

  const regions = data.map(mapDbRegion);
  const activeRegions = regions.filter((region) => region.status === "active");
  const comingSoonRegions = regions.filter((region) => region.status === "coming-soon");
  const properties = await getPublicProperties();
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
  const supabase = await createSupabaseServerClient();
  if (!supabase) return defaultAdminSettings;

  const { data } = await supabase
    .from("platform_settings")
    .select("whatsapp_number, brand, currency, homepage_text")
    .eq("id", 1)
    .maybeSingle();

  return mapPlatformSettingsRow(data as PlatformSettingsRow | null);
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
