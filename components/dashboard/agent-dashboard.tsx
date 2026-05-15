"use client";

import {
  ArrowDown,
  ArrowUp,
  Building2,
  Edit3,
  Home,
  ImagePlus,
  Inbox,
  LayoutDashboard,
  Loader2,
  Save,
  Upload,
  UserCircle2,
  X
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import type { AppUserSession } from "@/lib/auth/guards";
import { upsertPropertyAction } from "@/lib/actions/admin-data";
import { assets } from "@/lib/assets";
import { motionEase } from "@/components/motion";
import { PropertyImage } from "@/components/ui/property-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { MAX_PROPERTY_IMAGE_SIZE, validateImageMimeType } from "@/lib/property-images";
import { formatKgs, WHATSAPP_PHONE } from "@/lib/property-utils";
import type { Property, University } from "@/types/property";

type AgentSection = "overview" | "properties" | "add" | "inquiries" | "profile";
type AgentProperty = Property & { status: "active" | "draft" | "unavailable" };
type AgentInquiry = { id: string; name: string; apartmentTitle: string; date: string; whatsappNumber: string };
type FormSubmissionResult = { ok: boolean; message: string; reset?: boolean };

const agentNavItems = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "properties", label: "My Properties", icon: Home },
  { id: "add", label: "Add Property", icon: Building2 },
  { id: "inquiries", label: "Inquiries", icon: Inbox },
  { id: "profile", label: "Profile", icon: UserCircle2 }
] as const satisfies { id: AgentSection; label: string; icon: typeof LayoutDashboard }[];

const propertySchema = z.object({
  title: z.string().min(3, "Property title is required"),
  priceMonthly: z.coerce.number().min(1000, "Monthly rent must be at least 1,000 KGS"),
  description: z.string().min(20, "Description needs more detail"),
  location: z.string().min(3, "Location is required"),
  city: z.string().min(2, "City is required"),
  region: z.string().min(2, "Region is required"),
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

function createSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function toAgentProperty(property: Property): AgentProperty {
  return { ...property, status: property.status ?? "active" };
}

function propertyFromValues(values: PropertyFormValues, existing?: AgentProperty): AgentProperty {
  const amenities = values.amenities.split(",").map((item) => item.trim()).filter(Boolean);

  return {
    id: existing?.id ?? `STN-AGENT-${Date.now()}`,
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
    agent: existing?.agent ?? "Agent managed",
    landlordPhone: existing?.landlordPhone ?? `+${WHATSAPP_PHONE}`,
    description: values.description,
    status: values.status,
    createdBy: existing?.createdBy ?? null
  };
}

function valuesFromProperty(property?: AgentProperty): PropertyFormValues {
  return {
    title: property?.title ?? "",
    priceMonthly: property?.priceMonthly ?? 18000,
    description: property?.description ?? "",
    location: property?.location ?? "",
    city: property?.region ?? "Jalal-Abad",
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
    verified: property?.verified ?? false,
    featured: property?.popular ?? false,
    status: property?.status ?? "draft",
    images: property?.images ?? [assets.property1]
  };
}

function toPropertyPayload(property: AgentProperty) {
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

export function AgentDashboard({
  session,
  initialProperties,
  initialUniversities,
  initialInquiries
}: {
  session: AppUserSession;
  initialProperties: Property[];
  initialUniversities: University[];
  initialInquiries: AgentInquiry[];
}) {
  const [section, setSection] = useState<AgentSection>("overview");
  const [properties, setProperties] = useState<AgentProperty[]>(() => initialProperties.map(toAgentProperty));
  const [editingProperty, setEditingProperty] = useState<AgentProperty | null>(null);
  const [toast, setToast] = useState("");

  async function saveProperty(values: PropertyFormValues, existing?: AgentProperty): Promise<FormSubmissionResult> {
    const nextProperty = propertyFromValues(values, existing);
    const previousProperties = properties;

    try {
      setProperties((current) => {
        if (existing) return current.map((property) => property.id === existing.id ? nextProperty : property);
        return [nextProperty, ...current];
      });

      const result = await upsertPropertyAction(toPropertyPayload(nextProperty));
      if (!result.ok) {
        setProperties(previousProperties);
        setToast(`Failed to save property · ${result.message}`);
        return { ok: false, message: result.message ?? "Failed to save property" };
      }

      if (result.id && !existing) {
        setProperties((current) => current.map((property) => property.id === nextProperty.id ? { ...property, id: result.id } : property));
      }

      setEditingProperty(null);
      setSection("properties");
      setToast(existing ? "Property updated successfully" : "Property added successfully");
      return { ok: true, message: "Saved", reset: !existing };
    } catch (error) {
      setProperties(previousProperties);
      const message = error instanceof Error ? error.message : "Failed to save property";
      setToast(`Failed to save property · ${message}`);
      return { ok: false, message };
    }
  }

  return (
    <div className="figma-shell min-h-screen bg-[var(--background)] lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen lg:h-screen lg:grid-cols-[280px_1fr] lg:overflow-hidden">
        <aside className="flex flex-col border-b border-[var(--border)] bg-[var(--card)] p-4 lg:h-screen lg:overflow-hidden lg:border-b-0 lg:border-r lg:p-5">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">StudentNest</p>
            <h1 className="text-[22px] font-extrabold leading-[1.2]">Agent Dashboard</h1>
            <p className="mt-1 text-[12px] font-bold text-[var(--muted)]">{session.email}</p>
          </div>
          <nav className="mt-6 grid flex-1 content-start gap-1.5" aria-label="Agent navigation">
            {agentNavItems.map((item) => {
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
        </aside>
        <main className="min-w-0 p-4 sm:p-6 lg:h-screen lg:overflow-y-auto lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22, ease: motionEase }}>
              {section === "overview" ? <AgentOverview properties={properties} inquiries={initialInquiries} /> : null}
              {section === "properties" ? <AgentProperties properties={properties} onEdit={setEditingProperty} /> : null}
              {section === "add" ? <AgentPropertyForm universities={initialUniversities} onSubmit={(values) => saveProperty(values)} /> : null}
              {section === "inquiries" ? <AgentInquiries inquiries={initialInquiries} /> : null}
              {section === "profile" ? <AgentProfile session={session} /> : null}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <AnimatePresence>
        {editingProperty ? (
          <Modal title={`Edit ${editingProperty.title}`} onClose={() => setEditingProperty(null)}>
            <AgentPropertyForm property={editingProperty} universities={initialUniversities} onSubmit={(values) => saveProperty(values, editingProperty)} />
          </Modal>
        ) : null}
      </AnimatePresence>
      <div className="fixed bottom-4 left-4 z-[90]">{toast ? <Toast>{toast}</Toast> : null}</div>
    </div>
  );
}

function AgentOverview({ properties, inquiries }: { properties: AgentProperty[]; inquiries: AgentInquiry[] }) {
  const stats = [
    { label: "My properties", value: String(properties.length), icon: Home },
    { label: "Active listings", value: String(properties.filter((property) => property.status === "active").length), icon: Building2 },
    { label: "Inquiries", value: String(inquiries.length), icon: Inbox }
  ];

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
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
      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-[20px] font-extrabold">Recent listings</h3>
          <div className="mt-5 grid gap-3">
            {properties.length ? properties.slice(0, 4).map((property) => (
              <div key={property.id} className="rounded-[14px] bg-[var(--surface)] p-4 text-[13px] font-semibold">
                {property.title} · {property.price}
              </div>
            )) : <div className="rounded-[14px] bg-[var(--surface)] p-4 text-[13px] font-medium text-[var(--muted)]">No listings yet.</div>}
          </div>
        </div>
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-[20px] font-extrabold">Recent inquiries</h3>
          <div className="mt-5 grid gap-3">
            {inquiries.length ? inquiries.slice(0, 4).map((inquiry) => (
              <div key={inquiry.id} className="rounded-[14px] bg-[var(--surface)] p-4">
                <p className="text-[13px] font-bold text-[var(--muted-strong)]">{inquiry.name}</p>
                <p className="mt-1 text-[12px] font-normal text-[var(--muted)]">{inquiry.apartmentTitle}</p>
                <p className="mt-1 text-[11px] font-medium text-[var(--primary)]">{inquiry.date}</p>
              </div>
            )) : <div className="rounded-[14px] bg-[var(--surface)] p-4 text-[13px] font-medium text-[var(--muted)]">No inquiries yet.</div>}
          </div>
        </div>
      </div>
    </section>
  );
}

function AgentProperties({ properties, onEdit }: { properties: AgentProperty[]; onEdit: (property: AgentProperty) => void }) {
  return (
    <section className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
      <h3 className="text-[22px] font-extrabold">My properties</h3>
      <p className="mt-1 text-[13px] font-semibold text-[var(--muted)]">You can create and update your own listings. Delete actions stay admin-only.</p>
      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[1.4fr_1fr_120px_120px] rounded-[14px] bg-[var(--surface)] p-4 text-[12px] font-extrabold uppercase tracking-[0.06em] text-[var(--muted)]">
            <span>Apartment</span><span>University</span><span>Rent</span><span>Actions</span>
          </div>
          {properties.map((property) => (
            <div key={property.id} className="grid grid-cols-[1.4fr_1fr_120px_120px] items-center border-b border-[var(--border)] p-4 text-[13px] font-semibold">
              <div className="flex items-center gap-3">
                <PropertyImage src={property.image} alt="" width={48} height={48} className="h-12 w-12 rounded-[12px] object-cover" />
                <span><strong className="block text-[14px]">{property.title}</strong><small className="text-[var(--muted)]">{property.status}</small></span>
              </div>
              <span>{property.university}</span>
              <span>{property.price}</span>
              <Button size="sm" variant="outline" onClick={() => onEdit(property)}><Edit3 size={14} /> Edit</Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AgentPropertyForm({ property, universities, onSubmit }: { property?: AgentProperty; universities: University[]; onSubmit: (values: PropertyFormValues) => Promise<FormSubmissionResult> }) {
  const form = useForm<PropertyFormValues>({ resolver: zodResolver(propertySchema), defaultValues: valuesFromProperty(property) });
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

  async function submitForm(values: PropertyFormValues) {
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
          <option>Jalal-Abad</option>
        </select>
        <select className="focus-ring h-12 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 text-[14px] font-semibold" aria-label="Region" {...form.register("region")}>
          <option>Jalal-Abad</option>
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
      <div className="rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--surface)] p-5" onDrop={(event) => { event.preventDefault(); void handleFiles(event.dataTransfer.files); }} onDragOver={(event) => event.preventDefault()}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span><strong className="flex items-center gap-2 text-[15px] font-extrabold"><Upload size={17} /> Multi-image upload</strong><small className="mt-1 block text-[12px] font-semibold text-[var(--muted)]">Drag and drop images or choose files. Reorder and remove previews.</small></span>
          <label className="focus-ring inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 text-[13px] font-extrabold">
            <ImagePlus size={16} /> Choose images
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => void handleFiles(event.target.files)} />
          </label>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
      {formErrorMessage ? <p className="text-[13px] font-semibold text-[var(--muted)]">{formErrorMessage}</p> : null}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
        {form.formState.isSubmitting ? "Saving..." : "Save property"}
      </Button>
    </form>
  );
}

function AgentInquiries({ inquiries }: { inquiries: AgentInquiry[] }) {
  return (
    <section className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
      <h3 className="text-[22px] font-extrabold">Listing inquiries</h3>
      <div className="mt-5 grid gap-3">
        {inquiries.length ? inquiries.map((inquiry) => (
          <div key={inquiry.id} className="grid gap-3 rounded-[16px] bg-[var(--surface)] p-4 md:grid-cols-[1fr_1fr_140px_auto] md:items-center">
            <strong>{inquiry.name}</strong>
            <span className="text-[13px] font-semibold text-[var(--muted)]">{inquiry.apartmentTitle}</span>
            <span className="text-[13px] font-semibold">{inquiry.date}</span>
            <Button asChild size="sm"><a href={`https://wa.me/${inquiry.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a></Button>
          </div>
        )) : <div className="rounded-[16px] bg-[var(--surface)] p-4 text-[13px] font-semibold text-[var(--muted)]">No inquiries yet.</div>}
      </div>
    </section>
  );
}

function AgentProfile({ session }: { session: AppUserSession }) {
  return (
    <section className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
      <h3 className="text-[22px] font-extrabold">Profile</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[16px] bg-[var(--surface)] p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">Name</p>
          <p className="mt-2 text-[16px] font-extrabold">{session.fullName || "Agent profile"}</p>
        </div>
        <div className="rounded-[16px] bg-[var(--surface)] p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">Email</p>
          <p className="mt-2 text-[16px] font-extrabold">{session.email}</p>
        </div>
      </div>
    </section>
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
