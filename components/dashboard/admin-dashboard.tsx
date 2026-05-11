"use client";

import Image from "next/image";
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
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { useLocalStorageValue } from "@/hooks/use-local-storage";
import { useTheme } from "@/hooks/use-theme";
import { assets } from "@/lib/assets";
import { formatKgs, getWhatsAppHref, WHATSAPP_PHONE } from "@/lib/property-utils";
import type { Property, Region, University } from "@/types/property";

type AdminSection = "overview" | "properties" | "add" | "edit" | "universities" | "inquiries" | "featured" | "users" | "settings";
type AdminProperty = Property & { status: "active" | "draft" | "unavailable" };

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
  { id: "users", label: "Users", icon: Users },
  { id: "settings", label: "Settings", icon: Settings }
] as const satisfies { id: AdminSection; label: string; icon: typeof LayoutDashboard }[];

const propertySchema = z.object({
  title: z.string().min(3, "Property title is required"),
  priceMonthly: z.coerce.number().min(1000, "Monthly rent must be at least 1,000 KGS"),
  description: z.string().min(20, "Description needs more detail"),
  location: z.string().min(3, "Location is required"),
  city: z.enum(["Jalal-Abad", "Manas"]),
  region: z.enum(["Jalal-Abad", "Manas"]),
  university: z.string().min(3, "Nearby university is required"),
  distance: z.string().min(2, "Distance is required"),
  roomType: z.enum(["Studio", "Private room", "Shared room", "Apartment"]),
  roommates: z.coerce.number().min(0).max(8),
  furnished: z.boolean(),
  utilitiesIncluded: z.boolean(),
  genderPreference: z.enum(["Female only", "Male only", "Mixed"]),
  amenities: z.string().min(3, "Add at least one amenity"),
  availabilityDate: z.string().min(1, "Availability date is required"),
  verified: z.boolean(),
  featured: z.boolean(),
  status: z.enum(["active", "draft", "unavailable"]),
  images: z.array(z.string()).min(1, "Add at least one image")
});

type PropertyFormValues = z.infer<typeof propertySchema>;

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

type AdminSettings = z.infer<typeof settingsSchema>;

const defaultAdminSettings: AdminSettings = {
  whatsApp: `+${WHATSAPP_PHONE}`,
  brand: "StudentNest",
  currency: "KGS",
  homepage: "Safe, affordable student housing near your university."
};

function toAdminProperty(property: Property): AdminProperty {
  return { ...property, status: "active" };
}

function createSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function propertyFromValues(values: PropertyFormValues, existing?: AdminProperty): AdminProperty {
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
    type: values.roomType === "Studio" ? "Studio" : values.roomType === "Apartment" ? "Apartment" : "Shared Room",
    agent: existing?.agent ?? "Admin Managed",
    landlordPhone: existing?.landlordPhone ?? `+${WHATSAPP_PHONE}`,
    description: values.description,
    status: values.status
  };
}

function valuesFromProperty(property?: AdminProperty): PropertyFormValues {
  const city = property?.region ?? "Jalal-Abad";

  return {
    title: property?.title ?? "",
    priceMonthly: property?.priceMonthly ?? 18000,
    description: property?.description ?? "",
    location: property?.location ?? "",
    city,
    region: property?.region ?? "Jalal-Abad",
    university: property?.university ?? "Jalal-Abad International University (JAIU)",
    distance: property?.distance ?? "5 mins from campus",
    roomType: property?.roomType ?? "Shared room",
    roommates: property?.roommates ?? 2,
    furnished: property?.furnished ?? true,
    utilitiesIncluded: property?.utilitiesIncluded ?? true,
    genderPreference: property?.genderPreference ?? "Mixed",
    amenities: property?.amenities.join(", ") ?? "Fast WiFi, Study desk, Heating",
    availabilityDate: property?.availabilityDate ?? "2026-08-01",
    verified: property?.verified ?? true,
    featured: property?.popular ?? false,
    status: property?.status ?? "active",
    images: property?.images ?? [assets.property1]
  };
}

export function AdminDashboard({
  adminEmail,
  initialProperties,
  initialUniversities,
  initialActiveRegions,
  initialComingSoonRegions
}: {
  adminEmail?: string | null;
  initialProperties: Property[];
  initialUniversities: University[];
  initialActiveRegions: Region[];
  initialComingSoonRegions: Region[];
}) {
  const [section, setSection] = useState<AdminSection>("overview");
  const [properties, setProperties] = useLocalStorageValue<AdminProperty[]>("studentnest-admin-properties", initialProperties.map(toAdminProperty));
  const [universities, setUniversities] = useLocalStorageValue<University[]>("studentnest-admin-universities", initialUniversities);
  const [activeRegions, setActiveRegions] = useLocalStorageValue<Region[]>("studentnest-admin-active-regions", initialActiveRegions);
  const [comingSoonRegions, setComingSoonRegions] = useLocalStorageValue<Region[]>("studentnest-admin-coming-regions", initialComingSoonRegions);
  const [editingProperty, setEditingProperty] = useState<AdminProperty | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProperty | null>(null);
  const [deletedProperty, setDeletedProperty] = useState<AdminProperty | null>(null);
  const [toast, setToast] = useState("Admin workspace ready");
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
    { label: "Inquiries received", value: "128", icon: Inbox },
    { label: "Saved apartments", value: "342", icon: BadgeCheck },
    { label: "Total users", value: "1,284", icon: Users }
  ];

  function saveProperty(values: PropertyFormValues, existing?: AdminProperty) {
    const nextProperty = propertyFromValues(values, existing);
    setProperties((current) => {
      if (existing) return current.map((property) => property.id === existing.id ? nextProperty : property);
      return [nextProperty, ...current];
    });
    setEditingProperty(null);
    setSection("properties");
    setToast(existing ? "Property changes saved" : "New property added");
  }

  function deleteProperty() {
    if (!deleteTarget) return;
    setDeletedProperty(deleteTarget);
    setProperties((current) => current.filter((property) => property.id !== deleteTarget.id));
    setDeleteTarget(null);
    setToast("Property deleted. Undo is available.");
  }

  function undoDelete() {
    if (!deletedProperty) return;
    setProperties((current) => [deletedProperty, ...current]);
    setDeletedProperty(null);
    setToast("Property restored");
  }

  function toggleFeatured(id: string) {
    setProperties((current) => current.map((property) => property.id === id ? { ...property, popular: !property.popular } : property));
    setToast("Featured listing visibility updated");
  }

  function toggleAvailability(id: string) {
    setProperties((current) => current.map((property) => property.id === id ? { ...property, status: property.status === "active" ? "unavailable" : "active" } : property));
    setToast("Availability updated");
  }

  function moveFeatured(id: string, direction: "up" | "down") {
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
    setToast("Featured order updated");
  }

  function toggleRegion(region: Region) {
    if (region.status === "active") {
      setActiveRegions((current) => current.filter((item) => item.slug !== region.slug));
      setComingSoonRegions((current) => [...current, { ...region, status: "coming-soon" }]);
      setToast(`${region.name} marked coming soon`);
    } else {
      setComingSoonRegions((current) => current.filter((item) => item.slug !== region.slug));
      setActiveRegions((current) => [...current, { ...region, status: "active" }]);
      setToast(`${region.name} activated`);
    }
  }

  return (
    <div className="figma-shell min-h-screen bg-[var(--background)]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-[var(--border)] bg-[var(--card)] p-4 lg:border-b-0 lg:border-r lg:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">StudentNest</p>
              <h1 className="text-[22px] font-extrabold leading-[1.2]">Admin CMS</h1>
              {adminEmail ? <p className="mt-1 text-[12px] font-bold text-[var(--muted)]">{adminEmail}</p> : null}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={toggleTheme}>{isDark ? "Light" : "Dark"}</Button>
              <form action="/auth/logout" method="post">
                <Button size="sm" variant="outline" type="submit">Logout</Button>
              </form>
            </div>
          </div>
          <nav className="mt-6 grid gap-2" aria-label="Admin navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`focus-ring flex items-center gap-3 rounded-[14px] px-4 py-3 text-left text-[13px] font-extrabold transition ${section === item.id ? "bg-[var(--primary)] text-white dark:text-[#071411]" : "text-[var(--muted-strong)] hover:bg-[var(--surface)]"}`}
                  onClick={() => setSection(item.id)}
                >
                  <Icon size={17} /> {item.label}
                </button>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)] md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[var(--primary)]">Secure admin workspace</p>
              <h2 className="mt-1 text-[28px] font-extrabold leading-[1.2]">Student housing management</h2>
              <p className="mt-2 text-[14px] font-semibold text-[var(--muted)]">Manage KGS pricing, Jalal-Abad and Manas listings, universities, inquiries, regions, and homepage visibility.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setSection("properties")}><ListChecks size={17} /> Manage listings</Button>
              <Button onClick={() => setSection("add")}><Plus size={17} /> Add property</Button>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
              {section === "overview" ? <OverviewSection stats={stats} properties={safeProperties} /> : null}
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
              {section === "universities" ? <UniversitiesSection universities={safeUniversities} setUniversities={setUniversities} /> : null}
              {section === "inquiries" ? <InquiriesSection properties={safeProperties} /> : null}
              {section === "featured" ? <FeaturedSection properties={featuredProperties} onToggleFeatured={toggleFeatured} onMove={moveFeatured} /> : null}
              {section === "users" ? <UsersSection /> : null}
              {section === "settings" ? (
                <SettingsSection
                  activeRegions={safeActiveRegions}
                  comingSoonRegions={safeComingSoonRegions}
                  onToggleRegion={toggleRegion}
                  onSaved={() => setToast("Settings saved")}
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
        <Toast>{toast}</Toast>
        {deletedProperty ? (
          <Button size="sm" variant="outline" onClick={undoDelete}><RotateCcw size={15} /> Undo delete</Button>
        ) : null}
      </div>
    </div>
  );
}

function OverviewSection({ stats, properties }: { stats: { label: string; value: string; icon: typeof Home }[]; properties: AdminProperty[] }) {
  const activity = ["JAIU Riverside Studio marked featured", "New CAIMU inquiry received", "Manas region availability updated", "JASU rent changed to KGS"];
  const chart = ["h-20", "h-28", "h-16", "h-32", "h-24", "h-36"];

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
            {chart.map((height, index) => {
              const opacity = index === 5 ? "opacity-100" : "opacity-70";
              return <span key={index} className={`flex-1 rounded-t-[12px] bg-[var(--primary)] ${opacity} ${height}`} />;
            })}
          </div>
        </div>
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-[20px] font-extrabold">Recent activity</h3>
          <div className="mt-5 grid gap-3">
            {activity.map((item) => <div key={item} className="rounded-[14px] bg-[var(--surface)] p-3 text-[13px] font-bold text-[var(--muted-strong)]">{item}</div>)}
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
            <motion.div key={property.id} className="grid grid-cols-[1.3fr_1fr_120px_110px_170px] items-center border-b border-[var(--border)] p-4 text-[13px] font-semibold transition hover:bg-[rgba(23,166,115,0.04)]">
              <div className="flex items-center gap-3">
                <Image src={property.image} alt="" width={48} height={48} className="h-12 w-12 rounded-[12px] object-cover" />
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

function PropertyForm({ property, universities, onSubmit }: { property?: AdminProperty; universities: University[]; onSubmit: (values: PropertyFormValues) => void }) {
  const form = useForm<PropertyFormValues>({ resolver: zodResolver(propertySchema), defaultValues: valuesFromProperty(property) });
  const images = useWatch({ control: form.control, name: "images" }) ?? [];

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const previews = Array.from(files).map((file) => URL.createObjectURL(file));
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

  return (
    <form className="mt-6 grid gap-5 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Property title" aria-label="Property title" {...form.register("title")} />
        <Input type="number" placeholder="Monthly rent in KGS" aria-label="Monthly rent in KGS" {...form.register("priceMonthly")} />
        <Input placeholder="Location" aria-label="Location" {...form.register("location")} />
        <Input placeholder="Distance from university" aria-label="Distance from university" {...form.register("distance")} />
        <select className="focus-ring h-12 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 text-[14px] font-semibold" aria-label="Nearby university" {...form.register("university")}>
          {universities.map((university) => <option key={university.slug}>{university.name}</option>)}
        </select>
        <select className="focus-ring h-12 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 text-[14px] font-semibold" aria-label="Room type" {...form.register("roomType")}>
          <option>Studio</option><option>Private room</option><option>Shared room</option><option>Apartment</option>
        </select>
        <select className="focus-ring h-12 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 text-[14px] font-semibold" aria-label="City" {...form.register("city")}>
          <option>Jalal-Abad</option><option>Manas</option>
        </select>
        <select className="focus-ring h-12 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 text-[14px] font-semibold" aria-label="Region" {...form.register("region")}>
          <option>Jalal-Abad</option><option>Manas</option>
        </select>
        <Input type="number" placeholder="Roommate count" aria-label="Roommate count" {...form.register("roommates")} />
        <select className="focus-ring h-12 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 text-[14px] font-semibold" aria-label="Gender preference" {...form.register("genderPreference")}>
          <option>Mixed</option><option>Female only</option><option>Male only</option>
        </select>
        <Input type="date" aria-label="Available from date" {...form.register("availabilityDate")} />
        <select className="focus-ring h-12 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 text-[14px] font-semibold" aria-label="Listing status" {...form.register("status")}>
          <option>active</option><option>draft</option><option>unavailable</option>
        </select>
      </div>
      <textarea className="focus-ring min-h-28 rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-4 text-[14px] font-medium" placeholder="Property description" aria-label="Property description" {...form.register("description")} />
      <Input placeholder="Amenities, comma separated" aria-label="Amenities" {...form.register("amenities")} />
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
      <div className="rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--surface)] p-5" onDrop={(event) => { event.preventDefault(); handleFiles(event.dataTransfer.files); }} onDragOver={(event) => event.preventDefault()}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span><strong className="flex items-center gap-2 text-[15px] font-extrabold"><Upload size={17} /> Multi-image upload</strong><small className="mt-1 block text-[12px] font-semibold text-[var(--muted)]">Drag and drop images or choose files. Reorder and remove previews.</small></span>
          <label className="focus-ring inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 text-[13px] font-extrabold">
            <ImagePlus size={16} /> Choose images
            <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => handleFiles(event.target.files)} />
          </label>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((image, index) => (
            <div key={image} className="rounded-[14px] bg-[var(--card)] p-2">
              <Image src={image} alt="" width={220} height={140} unoptimized={image.startsWith("blob:")} className="h-28 w-full rounded-[12px] object-cover" />
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" type="button" onClick={() => moveImage(index, "up")}><ArrowUp size={13} /></Button>
                <Button size="sm" variant="outline" type="button" onClick={() => moveImage(index, "down")}><ArrowDown size={13} /></Button>
                <Button size="sm" variant="outline" type="button" onClick={() => form.setValue("images", images.filter((item) => item !== image), { shouldValidate: true })}><X size={13} /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {Object.values(form.formState.errors)[0]?.message ? <p className="text-[13px] font-semibold text-[var(--muted)]">{Object.values(form.formState.errors)[0]?.message}</p> : null}
      <Button type="submit"><Save size={17} /> Save property</Button>
    </form>
  );
}

function UniversitiesSection({ universities, setUniversities }: { universities: University[]; setUniversities: (value: University[] | ((current: University[]) => University[])) => void }) {
  const form = useForm<z.infer<typeof universitySchema>>({ resolver: zodResolver(universitySchema), defaultValues: { name: "", city: "Jalal-Abad", apartmentCount: 0, averageRent: "15,000 сом", nearbyListings: 0 } });
  const [editing, setEditing] = useState<University | null>(null);

  function saveUniversity(values: z.infer<typeof universitySchema>) {
    const nextUniversity = { ...values, slug: editing?.slug ?? createSlug(values.name) };
    setUniversities((current) => editing ? current.map((item) => item.slug === editing.slug ? nextUniversity : item) : [nextUniversity, ...current]);
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
              <Button size="sm" variant="outline" onClick={() => setUniversities((current) => current.filter((item) => item.slug !== university.slug))}>Remove</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function InquiriesSection({ properties }: { properties: AdminProperty[] }) {
  const inquiries = [
    { name: "Aigerim T.", apartment: properties[0], date: "2026-05-10" },
    { name: "Omar K.", apartment: properties[1], date: "2026-05-09" },
    { name: "Lin M.", apartment: properties[2], date: "2026-05-08" }
  ];

  return (
    <section className="mt-6 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
      <h3 className="text-[22px] font-extrabold">Messages and inquiries</h3>
      <div className="mt-5 grid gap-3">
        {inquiries.map((inquiry) => (
          <div key={`${inquiry.name}-${inquiry.date}`} className="grid gap-3 rounded-[16px] bg-[var(--surface)] p-4 md:grid-cols-[1fr_1fr_140px_auto] md:items-center">
            <strong>{inquiry.name}</strong>
            <span className="text-[13px] font-semibold text-[var(--muted)]">{inquiry.apartment?.title}</span>
            <span className="text-[13px] font-semibold">{inquiry.date}</span>
            <Button asChild size="sm"><a href={inquiry.apartment ? getWhatsAppHref(inquiry.apartment) : `https://wa.me/${WHATSAPP_PHONE}`} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp</a></Button>
          </div>
        ))}
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

function UsersSection() {
  const users = [
    ["Aigerim T.", "Medical student", "active", "12 saves"],
    ["Bek S.", "Landlord", "active", "4 listings"],
    ["Admin Team", "Admin", "verified", "CMS access"],
    ["Omar K.", "Exchange student", "active", "3 inquiries"]
  ];

  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {users.map(([name, role, status, activity]) => (
        <div key={name} className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)]"><Users size={20} /></div>
          <h3 className="mt-4 text-[17px] font-extrabold">{name}</h3>
          <p className="mt-1 text-[13px] font-semibold text-[var(--muted)]">{role}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-[11px] font-extrabold">{status}</span>
            <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-[11px] font-extrabold">{activity}</span>
          </div>
        </div>
      ))}
    </section>
  );
}

function SettingsSection({ activeRegions, comingSoonRegions, onToggleRegion, onSaved }: { activeRegions: Region[]; comingSoonRegions: Region[]; onToggleRegion: (region: Region) => void; onSaved: () => void }) {
  const [settings, setSettings] = useLocalStorageValue<AdminSettings>("studentnest-admin-settings", defaultAdminSettings);
  const form = useForm<AdminSettings>({ resolver: zodResolver(settingsSchema), defaultValues: settings });

  function saveSettings(values: AdminSettings) {
    setSettings(values);
    onSaved();
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
    <motion.div className="fixed inset-0 z-[80] overflow-y-auto bg-black/40 px-4 py-8 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="mx-auto w-full max-w-[980px] rounded-[24px] border border-[var(--border)] bg-[var(--background)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]" initial={{ opacity: 0, y: 22, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 22, scale: 0.97 }}>
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
    <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-black/40 px-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="w-full max-w-[440px] rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 22 }}>
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
