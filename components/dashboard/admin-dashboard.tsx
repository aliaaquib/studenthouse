"use client";

import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  Edit3,
  GripVertical,
  Home,
  ImagePlus,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  Star,
  Trash2,
  Upload,
  Users,
  X
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyImage } from "@/components/ui/property-image";
import { Toast } from "@/components/ui/toast";
import { deletePropertyAction, deleteUniversityAction, reorderFeaturedPropertiesAction, updatePlatformSettingsAction, updatePropertyFlagsAction, updateRegionAction, updateUserRoleAction, upsertPropertyAction, upsertUniversityAction } from "@/lib/actions/admin-data";
import { useTheme } from "@/hooks/use-theme";
import { type AdminSettings } from "@/lib/admin-settings";
import { MAX_PROPERTY_IMAGE_SIZE, validateImageMimeType } from "@/lib/property-images";
import { formatKgs, WHATSAPP_PHONE } from "@/lib/property-utils";
import { motionEase } from "@/components/motion";
import type { AppRole } from "@/lib/rbac";
import type { Property, Region, University } from "@/types/property";

type AdminSection = "overview" | "properties" | "add" | "edit" | "universities" | "inquiries" | "featured" | "agents" | "users" | "settings";
type AdminProperty = Property & { status: "active" | "draft" | "unavailable" };
type AdminInquiry = { id: string; name: string; apartmentTitle: string; date: string; whatsappNumber: string };
type AdminUser = { id: string; name: string; email?: string; role: AppRole; status: string; activity: string };
type FormSubmissionResult = { ok: boolean; message: string; reset?: boolean };

const EMPTY_PROPERTIES: AdminProperty[] = [];
const EMPTY_UNIVERSITIES: University[] = [];
const EMPTY_REGIONS: Region[] = [];

const navItems = [
  { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
  { id: "properties", label: "Properties", icon: Home },
  { id: "add", label: "Add Property", icon: Plus },
  { id: "edit", label: "Edit Property", icon: Edit3 },
  { id: "universities", label: "Universities", icon: Building2 },
  { id: "inquiries", label: "Messages/Inquiries", icon: Inbox },
  { id: "featured", label: "Featured Listings", icon: Star },
  { id: "agents", label: "Agents", icon: BadgeCheck },
  { id: "users", label: "Users", icon: Users },
  { id: "settings", label: "Settings", icon: Settings }
] as const satisfies { id: AdminSection; label: string; icon: typeof LayoutDashboard }[];

const propertySchema = z.object({
  title: z.string().min(3, "Property title is required"),
  priceMonthly: z.preprocess(
    (value) => (value === "" || value === null || typeof value === "undefined" ? undefined : Number(value)),
    z.number({ required_error: "Monthly rent is required", invalid_type_error: "Monthly rent is required" }).min(1000, "Monthly rent must be at least 1,000 KGS")
  ),
  description: z.string().min(20, "Description needs more detail"),
  location: z.string().min(3, "Location is required"),
  city: z.string().min(2, "City is required"),
  region: z.string().min(2, "Region is required"),
  university: z.string().min(3, "Nearby university is required"),
  distance: z.string().min(2, "Distance is required"),
  roomType: z.string().refine((value) => ["Studio", "Private room", "Shared room", "Apartment", "Dom"].includes(value), "Room type is required") as z.ZodType<"Studio" | "Private room" | "Shared room" | "Apartment" | "Dom">,
  roommates: z.preprocess(
    (value) => (value === "" || value === null || typeof value === "undefined" ? undefined : Number(value)),
    z.number({ required_error: "Roommate count is required", invalid_type_error: "Roommate count is required" }).min(0).max(8)
  ),
  furnished: z.boolean(),
  utilitiesIncluded: z.boolean(),
  genderPreference: z.string().refine((value) => ["Female only", "Male only", "Mixed"].includes(value), "Gender preference is required") as z.ZodType<"Female only" | "Male only" | "Mixed">,
  amenities: z.string().min(3, "Add at least one amenity"),
  availabilityDate: z.string().min(1, "Availability date is required"),
  verified: z.boolean(),
  featured: z.boolean(),
  status: z.string().refine((value) => ["active", "draft", "unavailable"].includes(value), "Listing status is required") as z.ZodType<"active" | "draft" | "unavailable">,
  images: z.array(z.string()).min(1, "Add at least one image")
});

type PropertyFormValues = z.input<typeof propertySchema>;
type PropertySubmitValues = z.output<typeof propertySchema>;

const universitySchema = z.object({
  name: z.string().min(3, "University name is required"),
  city: z.string().min(2, "City is required"),
  apartmentCount: z.coerce.number().min(0),
  averageRent: z.string().min(2, "Average rent is required"),
  nearbyListings: z.coerce.number().min(0)
});

const settingsSchema = z.object({
  whatsApp: z.string().min(8),
  brand: z.string().min(2),
  currency: z.literal("KGS"),
  homepage: z.string().min(10)
});

function toAdminProperty(property: Property): AdminProperty {
  return { ...property, status: property.status ?? "active" };
}

function createSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function propertyFromValues(values: PropertySubmitValues, existing?: AdminProperty): AdminProperty {
  const id = existing?.id ?? `STN-ADMIN-${Date.now()}`;
  const amenities = values.amenities.split(",").map((item) => item.trim()).filter(Boolean);

  return {
    id,
    slug: existing?.slug ?? createSlug(values.title),
    title: values.title,
    name: values.title,
    price: formatKgs(values.priceMonthly),
    priceMonthly: values.priceMonthly,
    location: values.location,
    city: values.city,
    region: values.region,
    university: values.university,
    distance: values.distance,
    roommates: values.roommates,
    roomType: values.roomType,
    furnished: values.furnished,
    utilitiesIncluded: values.utilitiesIncluded,
    badges: [
      values.utilitiesIncluded ? "Bills Included" : "Bills Separate",
      values.furnished ? "Fully Furnished" : "Unfurnished",
      values.genderPreference
    ],
    amenities,
    availabilityDate: values.availabilityDate,
    image: values.images[0],
    images: values.images,
    popular: values.featured,
    verified: values.verified,
    genderPreference: values.genderPreference,
    type: values.roomType === "Studio" ? "Studio" : values.roomType === "Apartment" ? "Apartment" : values.roomType === "Dom" ? "Dom" : "Shared Room",
    agent: existing?.agent ?? "Admin Managed",
    landlordPhone: existing?.landlordPhone ?? `+${WHATSAPP_PHONE}`,
    description: values.description,
    status: values.status
  };
}

function valuesFromProperty(property?: AdminProperty): PropertyFormValues {
  return {
    title: property?.title ?? "",
    priceMonthly: property?.priceMonthly ?? ("" as unknown as number),
    description: property?.description ?? "",
    location: property?.location ?? "",
    city: property?.city ?? "",
    region: property?.region ?? "",
    university: property?.university ?? "",
    distance: property?.distance ?? "",
    roomType: property?.roomType ?? ("" as PropertyFormValues["roomType"]),
    roommates: typeof property?.roommates === "number" ? property.roommates : ("" as unknown as number),
    furnished: property?.furnished ?? false,
    utilitiesIncluded: property?.utilitiesIncluded ?? false,
    genderPreference: property?.genderPreference ?? ("" as PropertyFormValues["genderPreference"]),
    amenities: property?.amenities?.join(", ") ?? "",
    availabilityDate: property?.availabilityDate ?? "",
    verified: property?.verified ?? false,
    featured: property?.popular ?? false,
    status: property?.status ?? ("" as PropertyFormValues["status"]),
    images: property?.images ?? []
  };
}

export function AdminDashboard({
  adminEmail,
  initialProperties,
  initialUniversities,
  initialActiveRegions,
  initialComingSoonRegions,
  initialSettings,
  initialUsers,
  initialInquiries,
  initialFavoritesCount,
  initialSection = "overview"
}: {
  adminEmail?: string | null;
  initialProperties: Property[];
  initialUniversities: University[];
  initialActiveRegions: Region[];
  initialComingSoonRegions: Region[];
  initialSettings: AdminSettings;
  initialUsers: AdminUser[];
  initialInquiries: AdminInquiry[];
  initialFavoritesCount: number;
  initialSection?: AdminSection;
}) {
  const router = useRouter();
  const [, startRefreshTransition] = useTransition();
  const [section, setSection] = useState<AdminSection>(initialSection);
  const [properties, setProperties] = useState<AdminProperty[]>(() => initialProperties.map(toAdminProperty));
  const [universities, setUniversities] = useState<University[]>(initialUniversities);
  const [activeRegions, setActiveRegions] = useState<Region[]>(initialActiveRegions);
  const [comingSoonRegions, setComingSoonRegions] = useState<Region[]>(initialComingSoonRegions);
  const [settings, setSettings] = useState<AdminSettings>(initialSettings);
  const [editingProperty, setEditingProperty] = useState<AdminProperty | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProperty | null>(null);
  const [deletedProperty, setDeletedProperty] = useState<AdminProperty | null>(null);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const { isDark, toggleTheme } = useTheme();

  const safeProperties = properties.length ? properties : EMPTY_PROPERTIES;
  const safeUniversities = universities.length ? universities : EMPTY_UNIVERSITIES;
  const safeActiveRegions = activeRegions.length ? activeRegions : EMPTY_REGIONS;
  const safeComingSoonRegions = comingSoonRegions.length ? comingSoonRegions : EMPTY_REGIONS;

  const filteredProperties = safeProperties.filter((property) => `${property.title} ${property.location} ${property.university}`.toLowerCase().includes(query.toLowerCase()));
  const featuredProperties = safeProperties.filter((property) => property.popular);
  const stats = [
    { label: "Total properties", value: String(safeProperties.length), icon: Home },
    { label: "Active listings", value: String(safeProperties.filter((property) => property.status === "active").length), icon: CheckCircle2 },
    { label: "Featured listings", value: String(featuredProperties.length), icon: Star },
    { label: "Inquiries received", value: String(initialInquiries.length), icon: Inbox },
    { label: "Saved apartments", value: String(initialFavoritesCount), icon: BadgeCheck },
    { label: "Total users", value: String(initialUsers.length), icon: Users }
  ];

  function toPropertyPayload(property: AdminProperty) {
    return {
      id: property.id.startsWith("STN-") ? undefined : property.id,
      title: property.title,
      slug: property.slug,
      description: property.description,
      monthlyRent: property.priceMonthly,
      location: property.location,
      region: property.region,
      universityName: property.university,
      distance: property.distance,
      roomType: property.roomType,
      furnished: property.furnished,
      utilitiesIncluded: property.utilitiesIncluded,
      genderPreference: property.genderPreference,
      amenities: property.amenities,
      roommateCount: property.roommates,
      verified: Boolean(property.verified),
      featured: Boolean(property.popular),
      status: property.status,
      availableFrom: property.availabilityDate,
      whatsappNumber: property.landlordPhone,
      images: property.images
    };
  }

async function saveProperty(values: PropertySubmitValues, existing?: AdminProperty): Promise<FormSubmissionResult> {
    const nextProperty = propertyFromValues(values, existing);
    const previousProperties = safeProperties;

    try {
      setProperties((current) => {
        if (existing) return current.map((property) => property.id === existing.id ? nextProperty : property);
        return [nextProperty, ...current];
      });

      const result = await upsertPropertyAction(toPropertyPayload(nextProperty));
      if (!result.ok) {
        setProperties(previousProperties);
        const message = result.message ?? "Failed to save property";
        setToast(`Failed to save property · ${message}`);
        return { ok: false, message };
      }

      if (result.id && !existing) {
        setProperties((current) => current.map((property) => property.id === nextProperty.id ? { ...property, id: result.id } : property));
      }

      setEditingProperty(null);
      setSection("properties");
      setToast(existing ? "Property updated successfully" : "Property added successfully");
      startRefreshTransition(() => {
        router.refresh();
      });

      return {
        ok: true,
        message: existing ? "Property updated successfully" : "Property added successfully",
        reset: !existing
      };
    } catch (error) {
      setProperties(previousProperties);
      const message = error instanceof Error ? error.message : "Failed to save property";
      setToast(`Failed to save property · ${message}`);
      return { ok: false, message };
    }
  }

  async function deleteProperty() {
    if (!deleteTarget) return;
    setDeletedProperty(deleteTarget);
    setProperties((current) => current.filter((property) => property.id !== deleteTarget.id));
    const result = await deletePropertyAction(deleteTarget.id);
    router.refresh();
    setDeleteTarget(null);
    setToast(result.ok ? "Property deleted. Undo is available." : `Unable to delete property · ${result.message}`);
  }

  async function undoDelete() {
    if (!deletedProperty) return;
    setProperties((current) => [deletedProperty, ...current]);
    await upsertPropertyAction({ ...toPropertyPayload(deletedProperty), id: undefined });
    router.refresh();
    setDeletedProperty(null);
    setToast("Property restored");
  }

  async function toggleFeatured(id: string) {
    const nextProperty = safeProperties.find((property) => property.id === id);
    const nextFeatured = !nextProperty?.popular;
    setProperties((current) => current.map((property) => property.id === id ? { ...property, popular: nextFeatured } : property));
    await updatePropertyFlagsAction(id, { featured: nextFeatured });
    router.refresh();
    setToast("Featured listing visibility updated");
  }

  async function toggleAvailability(id: string) {
    const nextProperty = safeProperties.find((property) => property.id === id);
    const nextStatus = nextProperty?.status === "active" ? "unavailable" : "active";
    setProperties((current) => current.map((property) => property.id === id ? { ...property, status: nextStatus, verified: nextStatus === "active" } : property));
    await updatePropertyFlagsAction(id, { status: nextStatus, verified: nextStatus === "active" });
    router.refresh();
    setToast("Availability updated");
  }

  async function moveFeatured(id: string, direction: "up" | "down") {
    const featuredIds = featuredProperties.map((property) => property.id);
    const from = featuredIds.indexOf(id);
    const to = direction === "up" ? from - 1 : from + 1;
    if (from < 0 || to < 0 || to >= featuredIds.length) return;
    const reordered = [...featuredIds];
    const [item] = reordered.splice(from, 1);
    reordered.splice(to, 0, item);
    setProperties((current) => [...current].sort((a, b) => {
      const aIndex = reordered.indexOf(a.id);
      const bIndex = reordered.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }));
    await reorderFeaturedPropertiesAction(reordered);
    router.refresh();
    setToast("Featured order updated");
  }

  async function toggleRegion(region: Region) {
    if (region.status === "active") {
      setActiveRegions((current) => current.filter((item) => item.slug !== region.slug));
      setComingSoonRegions((current) => [...current, { ...region, status: "coming-soon" }]);
      await updateRegionAction(region.name, "coming-soon");
      router.refresh();
      setToast(`${region.name} marked coming soon`);
    } else {
      setComingSoonRegions((current) => current.filter((item) => item.slug !== region.slug));
      setActiveRegions((current) => [...current, { ...region, status: "active" }]);
      await updateRegionAction(region.name, "active");
      router.refresh();
      setToast(`${region.name} activated`);
    }
  }

  async function saveUniversity(nextUniversity: University, editingSlug?: string) {
    setUniversities((current) => editingSlug ? current.map((item) => item.slug === editingSlug ? nextUniversity : item) : [nextUniversity, ...current]);
    const result = await upsertUniversityAction({
      name: nextUniversity.name.replace(/\s+\([^)]+\)$/, ""),
      shortName: nextUniversity.slug.toUpperCase(),
      city: nextUniversity.city,
      region: nextUniversity.city
    });
    router.refresh();
    setToast(result.ok ? "University saved" : `Unable to save university · ${result.message}`);
  }

  async function removeUniversity(university: University) {
    setUniversities((current) => current.filter((item) => item.slug !== university.slug));
    const result = await deleteUniversityAction(university.slug);
    router.refresh();
    setToast(result.ok ? "University removed" : `Unable to remove university · ${result.message}`);
  }

  async function saveSettings(nextSettings: AdminSettings) {
    setSettings(nextSettings);
    const result = await updatePlatformSettingsAction(nextSettings);
    router.refresh();
    setToast(result.ok ? "Settings saved" : `Unable to save settings · ${result.message}`);
  }

  return (
    <div className="figma-shell min-h-screen bg-[var(--background)] lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen lg:h-screen lg:grid-cols-[280px_1fr] lg:overflow-hidden">
        <aside className="flex flex-col border-b border-[var(--border)] bg-[var(--card)] p-4 lg:h-screen lg:overflow-hidden lg:border-b-0 lg:border-r lg:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">StudentNest</p>
              <h1 className="text-[22px] font-extrabold leading-[1.2]">Admin CMS</h1>
              {adminEmail ? <p className="mt-1 text-[12px] font-bold text-[var(--muted)]">{adminEmail}</p> : null}
            </div>
          </div>
          <nav className="mt-6 grid flex-1 content-start gap-1.5" aria-label="Admin navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`focus-ring flex items-center gap-3 rounded-[14px] px-4 py-2.5 text-left text-[13px] font-extrabold transition ${section === item.id ? "bg-[var(--primary)] text-white" : "text-[var(--muted-strong)] hover:bg-[var(--surface)]"}`}
                  onClick={() => setSection(item.id)}
                >
                  <Icon size={17} /> {item.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto grid gap-2 border-t border-[var(--border)] pt-4">
            <Button size="sm" variant="outline" onClick={toggleTheme}>{isDark ? "Light mode" : "Dark mode"}</Button>
            <form action="/auth/logout" method="post">
              <Button className="w-full" size="sm" variant="outline" type="submit">Logout</Button>
            </form>
          </div>
        </aside>
        <main className="min-w-0 p-4 sm:p-6 lg:h-screen lg:overflow-y-auto lg:p-8">
          <div className="flex flex-col gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)] md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[var(--primary)]">Secure admin workspace</p>
              <h2 className="mt-1 text-[28px] font-extrabold leading-[1.2]">Student housing management</h2>
              <p className="mt-2 text-[14px] font-semibold text-[var(--muted)]">Manage KGS pricing, Jalal-Abad listings, universities, inquiries, regions, and homepage visibility.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setSection("properties")}><ListChecks size={17} /> Manage listings</Button>
              <Button onClick={() => setSection("add")}><Plus size={17} /> Add property</Button>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22, ease: motionEase }}>
              {section === "overview" ? <OverviewSection stats={stats} properties={safeProperties} inquiries={initialInquiries} /> : null}
              {section === "properties" || section === "edit" ? (
                <PropertiesSection
                  properties={filteredProperties}
                  query={query}
                  onQueryChange={setQuery}
                  onEdit={setEditingProperty}
                  onDelete={setDeleteTarget}
                  onToggleFeatured={toggleFeatured}
                  onToggleAvailability={toggleAvailability}
                />
              ) : null}
              {section === "add" ? <PropertyForm universities={safeUniversities} onSubmit={(values) => saveProperty(values)} /> : null}
              {section === "universities" ? <UniversitiesSection universities={safeUniversities} onSave={saveUniversity} onRemove={removeUniversity} /> : null}
              {section === "inquiries" ? <InquiriesSection inquiries={initialInquiries} /> : null}
              {section === "featured" ? <FeaturedSection properties={featuredProperties} onToggleFeatured={toggleFeatured} onMove={moveFeatured} /> : null}
              {section === "agents" ? <AgentsSection users={initialUsers} /> : null}
              {section === "users" ? <UsersSection users={initialUsers} /> : null}
              {section === "settings" ? (
                <SettingsSection
                  settings={settings}
                  activeRegions={safeActiveRegions}
                  comingSoonRegions={safeComingSoonRegions}
                  onToggleRegion={toggleRegion}
                  onSaved={saveSettings}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <AnimatePresence>
        {editingProperty ? (
          <Modal title={`Edit ${editingProperty.title}`} onClose={() => setEditingProperty(null)}>
            <PropertyForm property={editingProperty} universities={safeUniversities} onSubmit={(values) => saveProperty(values, editingProperty)} />
          </Modal>
        ) : null}
        {deleteTarget ? (
          <ConfirmDeleteModal property={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={deleteProperty} />
        ) : null}
      </AnimatePresence>
      <div className="fixed bottom-4 left-4 z-[90] flex flex-col gap-3">
        {toast ? <Toast>{toast}</Toast> : null}
        {deletedProperty ? (
          <Button size="sm" variant="outline" onClick={undoDelete}><RotateCcw size={15} /> Undo delete</Button>
        ) : null}
      </div>
    </div>
  );
}

function OverviewSection({
  stats,
  properties,
  inquiries
}: {
  stats: { label: string; value: string; icon: typeof Home }[];
  properties: AdminProperty[];
  inquiries: AdminInquiry[];
}) {
  const weeklySeries = (() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const counts = labels.map(() => 0);

    inquiries.forEach((inquiry) => {
      const parsed = new Date(inquiry.date);
      if (Number.isNaN(parsed.getTime())) return;
      const jsDay = parsed.getDay();
      const index = jsDay === 0 ? 6 : jsDay - 1;
      counts[index] += 1;
    });

    const max = Math.max(...counts, 1);
    return labels.map((label, index) => ({
      label,
      count: counts[index],
      height: `${Math.max(18, (counts[index] / max) * 144)}px`
    }));
  })();

  return (
    <section className="mt-6 grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
              <Icon color="var(--primary)" size={22} />
              <strong className="mt-4 block text-[28px] font-extrabold">{stat.value}</strong>
              <span className="text-[13px] font-semibold text-[var(--muted)]">{stat.label}</span>
            </div>
          );
        })}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
          <h3 className="flex items-center gap-2 text-[20px] font-extrabold"><BarChart3 size={20} color="var(--primary)" /> Weekly inquiries</h3>
          <div className="mt-8 flex h-44 items-end gap-4">
            {weeklySeries.map((item) => (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                <span
                  className={`w-full rounded-t-[12px] bg-[var(--primary)] ${item.count ? "opacity-100" : "opacity-30"}`}
                  style={{ height: item.height }}
                />
                <div className="text-center">
                  <span className="block text-[12px] font-semibold text-[var(--muted-strong)]">{item.label}</span>
                  <span className="block text-[11px] font-normal text-[var(--muted)]">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-[20px] font-extrabold">Recent inquiries</h3>
          <div className="mt-5 grid gap-3">
            {inquiries.length ? inquiries.slice(0, 4).map((inquiry) => (
              <div key={inquiry.id} className="rounded-[14px] bg-[var(--surface)] p-3">
                <p className="text-[13px] font-bold text-[var(--muted-strong)]">{inquiry.name}</p>
                <p className="mt-1 text-[12px] font-normal text-[var(--muted)]">{inquiry.apartmentTitle}</p>
                <p className="mt-1 text-[11px] font-medium text-[var(--primary)]">{inquiry.date}</p>
              </div>
            )) : <div className="rounded-[14px] bg-[var(--surface)] p-3 text-[13px] font-medium text-[var(--muted)]">No inquiries yet.</div>}
          </div>
        </div>
      </div>
      <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-[20px] font-extrabold">Recent listings</h3>
        <div className="mt-5 grid gap-3">
          {properties.slice(0, 4).map((property) => <ListingRow key={property.id} property={property} />)}
        </div>
      </div>
    </section>
  );
}

function PropertiesSection({
  properties,
  query,
  onQueryChange,
  onEdit,
  onDelete,
  onToggleFeatured,
  onToggleAvailability
}: {
  properties: AdminProperty[];
  query: string;
  onQueryChange: (value: string) => void;
  onEdit: (property: AdminProperty) => void;
  onDelete: (property: AdminProperty) => void;
  onToggleFeatured: (id: string) => void;
  onToggleAvailability: (id: string) => void;
}) {
  return (
    <section className="mt-6 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-[22px] font-extrabold">Properties</h3>
          <p className="mt-1 text-[13px] font-semibold text-[var(--muted)]">Add, edit, delete, feature, verify, and manage availability.</p>
        </div>
        <label className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={17} />
          <Input className="pl-11 md:w-[320px]" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search listings" aria-label="Search admin listings" />
        </label>
      </div>
      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-[1.3fr_1fr_120px_110px_170px] rounded-[14px] bg-[var(--surface)] p-4 text-[12px] font-extrabold uppercase tracking-[0.06em] text-[var(--muted)]">
            <span>Apartment</span><span>University</span><span>Rent</span><span>Status</span><span>Actions</span>
          </div>
          {properties.map((property) => (
            <motion.div key={property.id} whileHover={{ x: 2 }} transition={{ duration: 0.18, ease: motionEase }} className="grid grid-cols-[1.3fr_1fr_120px_110px_170px] items-center border-b border-[var(--border)] p-4 text-[13px] font-semibold transition hover:bg-[rgba(23,166,115,0.04)]">
              <div className="flex items-center gap-3">
                <PropertyImage src={property.image} alt="" width={48} height={48} className="h-12 w-12 rounded-[12px] object-cover" />
                <span><strong className="block text-[14px]">{property.title}</strong><small className="text-[var(--muted)]">{property.id}</small></span>
              </div>
              <span>{property.university}</span>
              <span>{property.price}</span>
              <button type="button" className="rounded-full bg-[var(--surface)] px-3 py-1 text-[12px] font-extrabold" onClick={() => onToggleAvailability(property.id)}>{property.status}</button>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onToggleFeatured(property.id)}><Star size={14} fill={property.popular ? "currentColor" : "none"} /></Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(property)}><Edit3 size={14} /></Button>
                <Button size="sm" variant="outline" onClick={() => onDelete(property)}><Trash2 size={14} /></Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PropertyForm({ property, universities, onSubmit }: { property?: AdminProperty; universities: University[]; onSubmit: (values: PropertySubmitValues) => Promise<FormSubmissionResult> }) {
  const form = useForm<PropertyFormValues, unknown, PropertySubmitValues>({ resolver: zodResolver(propertySchema), defaultValues: valuesFromProperty(property) });
  const images = useWatch({ control: form.control, name: "images" }) ?? [];
  const [uploadError, setUploadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const formErrorMessage = Object.values(form.formState.errors)[0]?.message || uploadError || submitError;

  async function fileToDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const accepted = Array.from(files).filter((file) => {
      if (!validateImageMimeType(file.type)) {
        setUploadError("Only JPG, PNG, and WebP images are allowed.");
        return false;
      }
      if (file.size > MAX_PROPERTY_IMAGE_SIZE) {
        setUploadError("Each image must be smaller than 8MB.");
        return false;
      }
      return true;
    });
    if (!accepted.length) return;
    setUploadError("");
    const previews = await Promise.all(accepted.map(fileToDataUrl));
    form.setValue("images", [...images, ...previews], { shouldValidate: true });
  }

  function moveImage(index: number, direction: "up" | "down") {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    form.setValue("images", next, { shouldValidate: true });
  }

  async function submitForm(values: PropertySubmitValues) {
    setSubmitError("");
    const result = await onSubmit(values);
    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    if (result.reset) {
      form.reset(valuesFromProperty(undefined));
      setUploadError("");
    }
  }

  return (
    <form className="mt-6 grid gap-5 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]" onSubmit={form.handleSubmit(submitForm)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Enter property title" aria-label="Property title" {...form.register("title")} />
        <Input type="number" placeholder="Enter monthly rent in KGS" aria-label="Monthly rent in KGS" {...form.register("priceMonthly")} />
        <Input placeholder="Select property location" aria-label="Location" {...form.register("location")} />
        <Input placeholder="e.g. 5 mins from JAIU" aria-label="Distance from university" {...form.register("distance")} />
        <select className="focus-ring h-12 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 text-[14px] font-medium text-[var(--foreground)]" aria-label="Nearby university" {...form.register("university")}>
          <option value="" disabled>Choose nearby university</option>
          {universities.map((university) => <option key={university.slug} value={university.name}>{university.name}</option>)}
        </select>
        <select className="focus-ring h-12 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 text-[14px] font-medium text-[var(--foreground)]" aria-label="Room type" {...form.register("roomType")}>
          <option value="" disabled>Select room type</option>
          <option value="Studio">Studio</option><option value="Private room">Private room</option><option value="Shared room">Shared room</option><option value="Apartment">Apartment</option><option value="Dom">Dom</option>
        </select>
        <select className="focus-ring h-12 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 text-[14px] font-medium text-[var(--foreground)]" aria-label="City" {...form.register("city")}>
          <option value="" disabled>Select city</option>
          <option value="Jalal-Abad">Jalal-Abad</option>
        </select>
        <select className="focus-ring h-12 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 text-[14px] font-medium text-[var(--foreground)]" aria-label="Region" {...form.register("region")}>
          <option value="" disabled>Select region</option>
          <option value="Jalal-Abad">Jalal-Abad</option>
        </select>
        <Input type="number" placeholder="Enter roommate count" aria-label="Roommate count" {...form.register("roommates")} />
        <select className="focus-ring h-12 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 text-[14px] font-medium text-[var(--foreground)]" aria-label="Gender preference" {...form.register("genderPreference")}>
          <option value="" disabled>Select gender preference</option>
          <option value="Mixed">Mixed</option><option value="Female only">Female only</option><option value="Male only">Male only</option>
        </select>
        <Input type="date" aria-label="Available from date" {...form.register("availabilityDate")} />
        <select className="focus-ring h-12 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 text-[14px] font-medium text-[var(--foreground)]" aria-label="Listing status" {...form.register("status")}>
          <option value="" disabled>Select listing status</option>
          <option value="active">active</option><option value="draft">draft</option><option value="unavailable">unavailable</option>
        </select>
      </div>
      <textarea className="focus-ring min-h-28 rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-4 text-[14px] font-medium" placeholder="Describe the apartment, amenities, nearby universities, and student-friendly features." aria-label="Property description" {...form.register("description")} />
      <Input placeholder="Select amenities, comma separated" aria-label="Amenities" {...form.register("amenities")} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["furnished", "Furnished status"],
          ["utilitiesIncluded", "Utilities included"],
          ["verified", "Verified listing"],
          ["featured", "Featured listing"]
        ].map(([name, label]) => (
          <label key={name} className="flex items-center gap-3 rounded-[14px] bg-[var(--surface)] p-3 text-[13px] font-extrabold">
            <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" {...form.register(name as "furnished" | "utilitiesIncluded" | "verified" | "featured")} />
            {label}
          </label>
        ))}
      </div>
      <div className="rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--surface)] p-5" onDrop={(event) => { event.preventDefault(); void handleFiles(event.dataTransfer.files); }} onDragOver={(event) => event.preventDefault()}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span><strong className="flex items-center gap-2 text-[15px] font-extrabold"><Upload size={17} /> Multi-image upload</strong><small className="mt-1 block text-[12px] font-semibold text-[var(--muted)]">Drag and drop property images here, or choose files to upload. JPG, PNG, and WebP only.</small></span>
          <label className="focus-ring inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 text-[13px] font-extrabold">
            <ImagePlus size={16} /> Choose images
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => void handleFiles(event.target.files)} />
          </label>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {!images.length ? (
            <div className="col-span-full rounded-[14px] border border-dashed border-[var(--border)] bg-[var(--card)] px-4 py-8 text-center text-[13px] font-medium text-[var(--muted)]">
              No images uploaded yet. Add at least one photo to publish the listing.
            </div>
          ) : null}
          {images.map((image, index) => (
            <div key={`${image}-${index}`} className="rounded-[14px] bg-[var(--card)] p-2">
              <PropertyImage src={image} alt="" width={220} height={140} className="h-28 w-full rounded-[12px] object-cover" />
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" type="button" onClick={() => moveImage(index, "up")}><ArrowUp size={13} /></Button>
                <Button size="sm" variant="outline" type="button" onClick={() => moveImage(index, "down")}><ArrowDown size={13} /></Button>
                <Button size="sm" variant="outline" type="button" onClick={() => form.setValue("images", images.filter((_, itemIndex) => itemIndex !== index), { shouldValidate: true })}><X size={13} /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {formErrorMessage ? <p className="text-[13px] font-semibold text-[rgb(191,61,74)]">{formErrorMessage}</p> : null}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
        {form.formState.isSubmitting ? "Saving..." : "Save property"}
      </Button>
    </form>
  );
}

function UniversitiesSection({
  universities,
  onSave,
  onRemove
}: {
  universities: University[];
  onSave: (university: University, editingSlug?: string) => void | Promise<void>;
  onRemove: (university: University) => void | Promise<void>;
}) {
  const form = useForm<z.infer<typeof universitySchema>>({ resolver: zodResolver(universitySchema), defaultValues: { name: "", city: "Jalal-Abad", apartmentCount: 0, averageRent: "15,000 сом", nearbyListings: 0 } });
  const [editing, setEditing] = useState<University | null>(null);

  function saveUniversity(values: z.infer<typeof universitySchema>) {
    const nextUniversity = { ...values, slug: editing?.slug ?? createSlug(values.name) };
    void onSave(nextUniversity, editing?.slug);
    setEditing(null);
    form.reset({ name: "", city: "Jalal-Abad", apartmentCount: 0, averageRent: "15,000 сом", nearbyListings: 0 });
  }

  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <form className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]" onSubmit={form.handleSubmit(saveUniversity)}>
        <h3 className="text-[22px] font-extrabold">{editing ? "Edit university" : "Add university"}</h3>
        <div className="mt-5 grid gap-3">
          <Input placeholder="University name" {...form.register("name")} />
          <Input placeholder="City" {...form.register("city")} />
          <Input type="number" placeholder="Apartment count" {...form.register("apartmentCount")} />
          <Input placeholder="Average rent, e.g. 15,000 сом" {...form.register("averageRent")} />
          <Input type="number" placeholder="Nearby listings" {...form.register("nearbyListings")} />
        </div>
        <Button className="mt-5 w-full" type="submit">Save university</Button>
      </form>
      <div className="grid gap-3">
        {universities.map((university) => (
          <div key={university.slug} className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
            <strong className="block text-[16px] font-extrabold">{university.name}</strong>
            <span className="mt-2 block text-[13px] font-semibold text-[var(--muted)]">{university.apartmentCount} apartments · avg {university.averageRent} · {university.nearbyListings} nearby</span>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditing(university); form.reset(university); }}>Edit</Button>
              <Button size="sm" variant="outline" onClick={() => void onRemove(university)}>Remove</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function InquiriesSection({ inquiries }: { inquiries: AdminInquiry[] }) {
  return (
    <section className="mt-6 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
      <h3 className="text-[22px] font-extrabold">Messages and inquiries</h3>
      <div className="mt-5 grid gap-3">
        {inquiries.length ? inquiries.map((inquiry) => (
          <div key={inquiry.id} className="grid gap-3 rounded-[16px] bg-[var(--surface)] p-4 md:grid-cols-[1fr_1fr_140px_auto] md:items-center">
            <strong>{inquiry.name}</strong>
            <span className="text-[13px] font-semibold text-[var(--muted)]">{inquiry.apartmentTitle}</span>
            <span className="text-[13px] font-semibold">{inquiry.date}</span>
            <Button asChild size="sm"><a href={`https://wa.me/${inquiry.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp</a></Button>
          </div>
        )) : <div className="rounded-[16px] bg-[var(--surface)] p-4 text-[13px] font-semibold text-[var(--muted)]">No inquiries yet.</div>}
      </div>
    </section>
  );
}

function FeaturedSection({ properties, onToggleFeatured, onMove }: { properties: AdminProperty[]; onToggleFeatured: (id: string) => void; onMove: (id: string, direction: "up" | "down") => void }) {
  return (
    <section className="mt-6 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
      <h3 className="text-[22px] font-extrabold">Featured listings</h3>
      <div className="mt-5 grid gap-3">
        {properties.map((property) => (
          <div key={property.id} className="flex flex-col gap-3 rounded-[16px] bg-[var(--surface)] p-4 md:flex-row md:items-center md:justify-between">
            <span className="flex items-center gap-3"><GripVertical size={17} color="var(--muted)" /><strong>{property.title}</strong></span>
            <span className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onMove(property.id, "up")}><ArrowUp size={14} /></Button>
              <Button size="sm" variant="outline" onClick={() => onMove(property.id, "down")}><ArrowDown size={14} /></Button>
              <Button size="sm" variant="outline" onClick={() => onToggleFeatured(property.id)}>Unfeature</Button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RoleManager({
  user,
  allowedRoles
}: {
  user: AdminUser;
  allowedRoles: AppRole[];
}) {
  const [pendingRole, setPendingRole] = useState<AppRole | null>(null);

  async function setRole(role: AppRole) {
    setPendingRole(role);
    await updateUserRoleAction(user.id, role);
    setPendingRole(null);
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {allowedRoles.map((role) => (
        <Button
          key={role}
          size="sm"
          variant={user.role === role ? "default" : "outline"}
          disabled={pendingRole === role}
          onClick={() => void setRole(role)}
        >
          {pendingRole === role ? <Loader2 size={14} className="animate-spin" /> : null}
          {role === "agent" ? "Make agent" : role === "student" ? "Make student" : "Make admin"}
        </Button>
      ))}
    </div>
  );
}

function AgentsSection({ users }: { users: AdminUser[] }) {
  const agents = users.filter((user) => user.role === "agent");
  const students = users.filter((user) => user.role === "student");

  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
        <h3 className="text-[22px] font-extrabold">Agent accounts</h3>
        <div className="mt-5 grid gap-3">
          {agents.length ? agents.map((user) => (
            <div key={user.id} className="rounded-[18px] bg-[var(--surface)] p-4">
              <strong className="block text-[15px] font-extrabold">{user.name}</strong>
              <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">{user.role}</p>
              <p className="mt-1 text-[12px] font-medium text-[var(--muted)]">Active since {user.activity}</p>
              <RoleManager user={user} allowedRoles={["student"]} />
            </div>
          )) : <div className="rounded-[18px] bg-[var(--surface)] p-4 text-[13px] font-semibold text-[var(--muted)]">No agent accounts yet.</div>}
        </div>
      </div>
      <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
        <h3 className="text-[22px] font-extrabold">Promote students</h3>
        <div className="mt-5 grid gap-3">
          {students.length ? students.map((user) => (
            <div key={user.id} className="rounded-[18px] bg-[var(--surface)] p-4">
              <strong className="block text-[15px] font-extrabold">{user.name}</strong>
              <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">{user.role}</p>
              <p className="mt-1 text-[12px] font-medium text-[var(--muted)]">Joined {user.activity}</p>
              <RoleManager user={user} allowedRoles={["agent"]} />
            </div>
          )) : <div className="rounded-[18px] bg-[var(--surface)] p-4 text-[13px] font-semibold text-[var(--muted)]">No student accounts available for promotion.</div>}
        </div>
      </div>
    </section>
  );
}

function UsersSection({ users }: { users: AdminUser[] }) {
  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {users.length ? users.map((user) => (
        <div key={user.id} className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)]"><Users size={20} /></div>
          <h3 className="mt-4 text-[17px] font-extrabold">{user.name}</h3>
          <p className="mt-1 text-[13px] font-semibold capitalize text-[var(--muted)]">{user.role}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-[11px] font-extrabold">{user.status}</span>
            <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-[11px] font-extrabold">{user.activity}</span>
          </div>
          <RoleManager user={user} allowedRoles={["student", "agent", "admin"]} />
        </div>
      )) : <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 text-[13px] font-semibold text-[var(--muted)] shadow-[var(--shadow-card)]">No users found yet.</div>}
    </section>
  );
}

function SettingsSection({
  settings,
  activeRegions,
  comingSoonRegions,
  onToggleRegion,
  onSaved
}: {
  settings: AdminSettings;
  activeRegions: Region[];
  comingSoonRegions: Region[];
  onToggleRegion: (region: Region) => void | Promise<void>;
  onSaved: (values: AdminSettings) => void | Promise<void>;
}) {
  const form = useForm<AdminSettings>({ resolver: zodResolver(settingsSchema), defaultValues: settings });

  useEffect(() => {
    form.reset(settings);
  }, [form, settings]);

  function saveSettings(values: AdminSettings) {
    void onSaved(values);
  }

  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <form className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]" onSubmit={form.handleSubmit(saveSettings)}>
        <h3 className="text-[22px] font-extrabold">Platform settings</h3>
        <div className="mt-5 grid gap-3">
          <Input placeholder="WhatsApp number" {...form.register("whatsApp")} />
          <Input placeholder="Platform branding" {...form.register("brand")} />
          <Input placeholder="Default currency" {...form.register("currency")} />
          <textarea className="focus-ring min-h-24 rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-4 text-[14px] font-medium" placeholder="Homepage text" {...form.register("homepage")} />
        </div>
        <Button className="mt-5 w-full" type="submit">Save settings</Button>
      </form>
      <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
        <h3 className="text-[22px] font-extrabold">Regions and filters</h3>
        <p className="mt-2 text-[13px] font-semibold text-[var(--muted)]">Activate or pause regions. Room types, amenities, and filter categories remain KGS-ready.</p>
        <div className="mt-5 grid gap-3">
          {[...activeRegions, ...comingSoonRegions].map((region) => (
            <div key={region.slug} className="flex items-center justify-between rounded-[14px] bg-[var(--surface)] p-3">
              <span className="flex items-center gap-2 text-[13px] font-extrabold">{region.status === "active" ? <CheckCircle2 size={16} color="var(--primary)" /> : <Clock size={16} color="var(--muted)" />} {region.name}</span>
              <Button size="sm" variant="outline" onClick={() => onToggleRegion(region)}>{region.status === "active" ? "Deactivate" : "Activate"}</Button>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-2 text-[12px] font-extrabold text-[var(--muted)] sm:grid-cols-3">
          {["Room types", "Amenities", "Gender preferences"].map((item) => <span key={item} className="rounded-full bg-[var(--surface)] px-3 py-2">{item}</span>)}
        </div>
      </div>
    </section>
  );
}

function ListingRow({ property }: { property: AdminProperty }) {
  return (
    <div className="grid gap-3 rounded-[14px] bg-[var(--surface)] p-4 md:grid-cols-[1fr_1fr_120px] md:items-center">
      <strong>{property.title}</strong>
      <span className="text-[13px] font-semibold text-[var(--muted)]">{property.university}</span>
      <span className="text-[13px] font-extrabold text-[var(--primary)]">{property.price}</span>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[80] overflow-y-auto bg-black/40 px-4 py-8 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: motionEase }}>
      <motion.div className="mx-auto w-full max-w-[980px] rounded-[24px] border border-[var(--border)] bg-[var(--background)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]" initial={{ opacity: 0, y: 22, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 22, scale: 0.97 }} transition={{ duration: 0.22, ease: motionEase }}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[24px] font-extrabold">{title}</h2>
          <Button variant="outline" size="sm" onClick={onClose}><X size={15} /></Button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function ConfirmDeleteModal({ property, onCancel, onConfirm }: { property: AdminProperty; onCancel: () => void; onConfirm: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-black/40 px-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: motionEase }}>
      <motion.div className="w-full max-w-[440px] rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 22 }} transition={{ duration: 0.22, ease: motionEase }}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)]"><LockKeyhole size={22} /></div>
        <h2 className="mt-5 text-[24px] font-extrabold">Delete listing?</h2>
        <p className="mt-2 text-[14px] font-semibold leading-[1.7] text-[var(--muted)]">{property.title} will be removed from admin listings. You can undo immediately after deletion.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}><Trash2 size={16} /> Delete</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
