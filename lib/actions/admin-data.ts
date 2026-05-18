"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import type { AdminSettings } from "@/lib/admin-settings";
import { getCurrentSession } from "@/lib/auth/guards";
import { extractSupabaseStoragePath, getImageUploadExtension, isAbsoluteImageUrl, isLocalAssetImage, isSupabaseStoragePath, MAX_PROPERTY_IMAGE_SIZE, normalizePropertyImageReference, parseDataImageUrl, PROPERTY_IMAGE_BUCKET, validateImageMimeType } from "@/lib/property-images";
import { canCreateProperty, canDeleteProperty, canEditProperty, isAdmin, type AppRole } from "@/lib/rbac";
import { isTrustedOrigin, publicErrorMessage, sanitizeMultilineText, sanitizeSingleLineText } from "@/lib/security";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PropertyPayload = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  monthlyRent: number;
  location: string;
  region: string;
  universityName: string;
  distance: string;
  roomType: "Studio" | "Private room" | "Shared room" | "Apartment" | "Dom";
  furnished: boolean;
  utilitiesIncluded: boolean;
  genderPreference: "Female only" | "Male only" | "Mixed";
  amenities: string[];
  roommateCount: number;
  verified: boolean;
  featured: boolean;
  status?: "active" | "draft" | "unavailable";
  availableFrom: string;
  whatsappNumber: string;
  images: string[];
};

const propertyPayloadSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3).max(120),
  slug: z.string().min(3).max(160).regex(/^[a-z0-9-]+$/),
  description: z.string().min(20).max(3000),
  monthlyRent: z.number().int().min(1000).max(500000),
  location: z.string().min(3).max(160),
  region: z.string().min(2).max(80),
  universityName: z.string().min(3).max(160),
  distance: z.string().min(2).max(80),
  roomType: z.enum(["Studio", "Private room", "Shared room", "Apartment", "Dom"]),
  furnished: z.boolean(),
  utilitiesIncluded: z.boolean(),
  genderPreference: z.enum(["Female only", "Male only", "Mixed"]),
  amenities: z.array(z.string().min(1).max(80)).max(20),
  roommateCount: z.number().int().min(0).max(8),
  verified: z.boolean(),
  featured: z.boolean(),
  status: z.enum(["active", "draft", "unavailable"]).optional(),
  availableFrom: z.string().min(1).max(32),
  whatsappNumber: z.string().min(8).max(24),
  images: z.array(z.string().min(1)).min(1).max(12)
});

function revalidatePropertyViews() {
  ["public-properties", "regions", "universities"].forEach((tag) => revalidateTag(tag));
  ["/", "/properties", "/search", "/saved", "/favorites", "/dashboard", "/universities", "/admin/dashboard", "/agent"].forEach((path) => revalidatePath(path));
}

async function getWriteClient() {
  return getSupabaseAdminClient() ?? await createSupabaseServerClient();
}

async function ensureTrustedMutationRequest() {
  const requestHeaders = await headers();
  return isTrustedOrigin(requestHeaders);
}

async function findUniversityId(universityName: string, supabase: NonNullable<Awaited<ReturnType<typeof getWriteClient>>>) {

  const { data } = await supabase
    .from("universities")
    .select("id")
    .or(`name.eq.${universityName},short_name.eq.${universityName}`)
    .maybeSingle();

  return data?.id ?? null;
}

async function uploadPropertyImages(propertyId: string, slug: string, images: string[]) {
  const supabase = await getWriteClient();
  if (!supabase) return [] as string[];

  const uploaded: string[] = [];

  for (const [index, image] of images.entries()) {
    const normalizedReference = normalizePropertyImageReference(image);
    if (isAbsoluteImageUrl(normalizedReference) || isLocalAssetImage(normalizedReference) || isSupabaseStoragePath(normalizedReference)) {
      uploaded.push(normalizedReference);
      continue;
    }

    const parsed = parseDataImageUrl(image);
    if (!parsed || !validateImageMimeType(parsed.mimeType)) continue;

    const bytes = Buffer.from(parsed.base64, "base64");
    if (!bytes.byteLength || bytes.byteLength > MAX_PROPERTY_IMAGE_SIZE) continue;
    const extension = getImageUploadExtension(parsed.mimeType);
    const path = `${propertyId}/${slug}-${index}-${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from(PROPERTY_IMAGE_BUCKET)
      .upload(path, bytes, {
        contentType: parsed.mimeType,
        upsert: true
      });

    if (error) continue;
    uploaded.push(path);
  }

  return uploaded;
}

async function listPropertyStoragePaths(propertyId: string) {
  const supabase = await getWriteClient();
  if (!supabase) return [] as string[];

  const { data } = await supabase
    .from("property_images")
    .select("image_url")
    .eq("property_id", propertyId);

  return (data ?? [])
    .map((row) => extractSupabaseStoragePath(row.image_url))
    .filter((value): value is string => Boolean(value));
}

async function deletePropertyStorageObjects(paths: string[]) {
  const supabase = await getWriteClient();
  if (!supabase || !paths.length) return;

  await supabase.storage.from(PROPERTY_IMAGE_BUCKET).remove(paths);
}

export async function upsertPropertyAction(payload: PropertyPayload) {
  if (!await ensureTrustedMutationRequest()) {
    return { ok: false, message: "Invalid request origin." };
  }

  const session = await getCurrentSession();
  if (!session || !canCreateProperty(session.role)) return { ok: false, message: "You do not have permission to save properties." };

  const parsed = propertyPayloadSchema.safeParse({
    ...payload,
    title: sanitizeSingleLineText(payload.title, 120),
    slug: sanitizeSingleLineText(payload.slug, 160).toLowerCase(),
    description: sanitizeMultilineText(payload.description, 3000),
    location: sanitizeSingleLineText(payload.location, 160),
    region: sanitizeSingleLineText(payload.region, 80),
    universityName: sanitizeSingleLineText(payload.universityName, 160),
    distance: sanitizeSingleLineText(payload.distance, 80),
    whatsappNumber: sanitizeSingleLineText(payload.whatsappNumber, 24),
    amenities: payload.amenities.map((item) => sanitizeSingleLineText(item, 80)).filter(Boolean)
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid property details." };
  }

  payload = parsed.data;

  const supabase = await getWriteClient();
  if (!supabase) return { ok: false, skipped: true, message: "Supabase is not configured." };

  const universityId = await findUniversityId(payload.universityName, supabase);
  let existingPropertyOwnerId: string | null = null;

  if (payload.id) {
    const { data: existingProperty } = await supabase
      .from("properties")
      .select("id, created_by")
      .eq("id", payload.id)
      .maybeSingle();

    existingPropertyOwnerId = existingProperty?.created_by ?? null;
    if (!canEditProperty(session, existingPropertyOwnerId)) {
      return { ok: false, message: "You do not have permission to edit this property." };
    }
  }

  const propertyRow = {
    title: payload.title,
    slug: payload.slug,
    description: payload.description,
    monthly_rent: payload.monthlyRent,
    currency: "KGS",
    location: payload.location,
    region: payload.region,
    nearby_university_id: universityId,
    distance_from_university: payload.distance,
    room_type: payload.roomType,
    shared_room: payload.roomType === "Shared room",
    furnished: payload.furnished,
    utilities_included: payload.utilitiesIncluded,
    gender_preference: payload.genderPreference,
    amenities: payload.amenities,
    roommate_count: payload.roommateCount,
    verified: payload.verified,
    featured: payload.featured,
    listing_status: payload.status ?? (payload.verified ? "active" : "unavailable"),
    available_from: payload.availableFrom,
    whatsapp_number: payload.whatsappNumber,
    created_by: payload.id ? (existingPropertyOwnerId ?? session.id) : session.id
  };

  const query = payload.id
    ? supabase.from("properties").update(propertyRow).eq("id", payload.id).select("id").single()
    : supabase.from("properties").insert(propertyRow).select("id").single();
  const { data, error } = await query;
  if (error || !data) return { ok: false, message: publicErrorMessage(error, "Unable to save property.") };

  const existingStoragePaths = await listPropertyStoragePaths(data.id);
  const normalizedImages = await uploadPropertyImages(data.id, payload.slug, payload.images);
  await supabase.from("property_images").delete().eq("property_id", data.id);
  if (normalizedImages.length) {
    await supabase.from("property_images").insert(normalizedImages.map((imageUrl, index) => ({
      property_id: data.id,
      image_url: imageUrl,
      sort_order: index
    })));
  }
  const nextStoragePaths = normalizedImages
    .map((image) => extractSupabaseStoragePath(image))
    .filter((value): value is string => Boolean(value));
  const staleStoragePaths = existingStoragePaths.filter((path) => !nextStoragePaths.includes(path));
  await deletePropertyStorageObjects(staleStoragePaths);

  revalidatePropertyViews();
  return { ok: true, id: data.id };
}

export async function deletePropertyAction(id: string) {
  if (!await ensureTrustedMutationRequest()) {
    return { ok: false, message: "Invalid request origin." };
  }

  const session = await getCurrentSession();
  if (!canDeleteProperty(session)) return { ok: false, message: "Only admins can delete properties." };

  const supabase = await getWriteClient();
  if (!supabase) return { ok: false, skipped: true, message: "Supabase is not configured." };

  const existingStoragePaths = await listPropertyStoragePaths(id);
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) return { ok: false, message: publicErrorMessage(error, "Unable to delete property.") };
  await deletePropertyStorageObjects(existingStoragePaths);

  revalidatePropertyViews();
  return { ok: true };
}

export async function updatePropertyFlagsAction(id: string, values: { featured?: boolean; verified?: boolean; status?: "active" | "draft" | "unavailable" }) {
  if (!await ensureTrustedMutationRequest()) {
    return { ok: false, message: "Invalid request origin." };
  }

  const session = await getCurrentSession();
  if (!isAdmin(session?.role)) return { ok: false, message: "Only admins can update listing flags." };

  const supabase = await getWriteClient();
  if (!supabase) return { ok: false, skipped: true, message: "Supabase is not configured." };

  const updates: Record<string, boolean | string> = {};
  if (typeof values.featured === "boolean") updates.featured = values.featured;
  if (typeof values.verified === "boolean") updates.verified = values.verified;
  if (values.status) updates.listing_status = values.status;

  const { error } = await supabase.from("properties").update(updates).eq("id", id);
  if (error) return { ok: false, message: publicErrorMessage(error, "Unable to update listing flags.") };

  revalidatePropertyViews();
  return { ok: true };
}

export async function reorderFeaturedPropertiesAction(ids: string[]) {
  if (!await ensureTrustedMutationRequest()) {
    return { ok: false, message: "Invalid request origin." };
  }

  const session = await getCurrentSession();
  if (!isAdmin(session?.role)) return { ok: false, message: "Only admins can reorder featured properties." };

  const supabase = await getWriteClient();
  if (!supabase) return { ok: false, skipped: true, message: "Supabase is not configured." };

  const updates = await Promise.all(
    ids.map((id, index) =>
      supabase.from("properties").update({ featured_rank: index }).eq("id", id)
    )
  );

  const failed = updates.find((result) => result.error);
  if (failed?.error) return { ok: false, message: publicErrorMessage(failed.error, "Unable to reorder featured listings.") };

  revalidatePropertyViews();
  return { ok: true };
}

export async function upsertUniversityAction(payload: { id?: string; name: string; shortName?: string; city: string; region: string }) {
  if (!await ensureTrustedMutationRequest()) {
    return { ok: false, message: "Invalid request origin." };
  }

  const session = await getCurrentSession();
  if (!isAdmin(session?.role)) return { ok: false, message: "Only admins can manage universities." };

  const supabase = await getWriteClient();
  if (!supabase) return { ok: false, skipped: true, message: "Supabase is not configured." };

  const row = {
    name: payload.name,
    short_name: payload.shortName ?? null,
    city: payload.city,
    region: payload.region
  };

  const { error } = payload.id
    ? await supabase.from("universities").update(row).eq("id", payload.id)
    : await supabase.from("universities").insert(row);
  if (error) return { ok: false, message: publicErrorMessage(error, "Unable to save university.") };

  revalidatePath("/universities");
  revalidatePath("/admin/dashboard");
  revalidateTag("universities");
  return { ok: true };
}

export async function deleteUniversityAction(identifier: string) {
  if (!await ensureTrustedMutationRequest()) {
    return { ok: false, message: "Invalid request origin." };
  }

  const session = await getCurrentSession();
  if (!isAdmin(session?.role)) return { ok: false, message: "Only admins can manage universities." };

  const supabase = await getWriteClient();
  if (!supabase) return { ok: false, skipped: true, message: "Supabase is not configured." };

  const { error } = await supabase
    .from("universities")
    .delete()
    .or(`id.eq.${identifier},short_name.eq.${identifier.toUpperCase()}`);
  if (error) return { ok: false, message: publicErrorMessage(error, "Unable to remove university.") };

  revalidatePath("/universities");
  revalidatePath("/admin/dashboard");
  revalidateTag("universities");
  return { ok: true };
}

export async function updateRegionAction(name: string, status: "active" | "coming-soon") {
  if (!await ensureTrustedMutationRequest()) {
    return { ok: false, message: "Invalid request origin." };
  }

  const session = await getCurrentSession();
  if (!isAdmin(session?.role)) return { ok: false, message: "Only admins can manage regions." };

  const supabase = await getWriteClient();
  if (!supabase) return { ok: false, skipped: true, message: "Supabase is not configured." };

  const { error } = await supabase
    .from("regions")
    .update({ is_active: status === "active", coming_soon: status === "coming-soon" })
    .eq("name", name);
  if (error) return { ok: false, message: publicErrorMessage(error, "Unable to update regions.") };

  revalidatePath("/");
  revalidatePath("/universities");
  revalidatePath("/search");
  revalidatePath("/admin/dashboard");
  revalidateTag("regions");
  return { ok: true };
}

export async function updatePlatformSettingsAction(settings: AdminSettings) {
  if (!await ensureTrustedMutationRequest()) {
    return { ok: false, message: "Invalid request origin." };
  }

  const session = await getCurrentSession();
  if (!isAdmin(session?.role)) return { ok: false, message: "Only admins can update platform settings." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, skipped: true, message: "Supabase is not configured." };

  const { error } = await supabase.from("platform_settings").upsert({
    id: 1,
    whatsapp_number: settings.whatsApp,
    brand: settings.brand,
    currency: settings.currency,
    homepage_text: settings.homepage
  });

  if (error) return { ok: false, message: publicErrorMessage(error, "Unable to save platform settings.") };

  ["platform-settings"].forEach((tag) => revalidateTag(tag));
  ["/", "/properties", "/search", "/saved", "/favorites", "/dashboard", "/universities", "/admin/dashboard", "/agent", "/about", "/add-property"].forEach((path) => revalidatePath(path));
  return { ok: true };
}

export async function updateUserRoleAction(userId: string, role: AppRole) {
  if (!await ensureTrustedMutationRequest()) {
    return { ok: false, message: "Invalid request origin." };
  }

  const session = await getCurrentSession();
  if (!isAdmin(session?.role)) return { ok: false, message: "Only admins can update user roles." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, skipped: true, message: "Supabase is not configured." };

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, message: publicErrorMessage(error, "Unable to update user role.") };

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/agents");
  revalidatePath("/agent");
  return { ok: true };
}
