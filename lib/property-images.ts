import { assets } from "@/lib/assets";

export const PROPERTY_IMAGE_BUCKET = "properties";
export const PROPERTY_IMAGE_FALLBACK = assets.property1;

export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
export const MAX_PROPERTY_IMAGE_SIZE = 8 * 1024 * 1024;

function stripSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

export function isDataImageUrl(value: string) {
  return value.startsWith("data:image/");
}

export function isAbsoluteImageUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

export function isLocalAssetImage(value: string) {
  return value.startsWith("/assets/");
}

export function isSupabaseStoragePath(value: string) {
  return !isDataImageUrl(value) && !isAbsoluteImageUrl(value) && !isLocalAssetImage(value);
}

export function isSupabaseStoragePublicUrl(value: string) {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl) return false;
  return value.startsWith(`${projectUrl}/storage/v1/object/public/${PROPERTY_IMAGE_BUCKET}/`);
}

export function getSupabaseStoragePublicUrl(path: string) {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl) return PROPERTY_IMAGE_FALLBACK;
  return `${projectUrl}/storage/v1/object/public/${PROPERTY_IMAGE_BUCKET}/${stripSlashes(path)}`;
}

export function extractSupabaseStoragePath(value?: string | null) {
  if (!value) return null;
  if (isSupabaseStoragePath(value)) return stripSlashes(value);

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl) return null;

  const prefix = `${projectUrl}/storage/v1/object/public/${PROPERTY_IMAGE_BUCKET}/`;
  if (!value.startsWith(prefix)) return null;
  return stripSlashes(value.slice(prefix.length));
}

export function resolvePropertyImageUrl(value?: string | null) {
  if (!value) return PROPERTY_IMAGE_FALLBACK;
  if (isAbsoluteImageUrl(value) || isDataImageUrl(value) || isLocalAssetImage(value)) return value;
  return getSupabaseStoragePublicUrl(value);
}

export function resolvePropertyImageUrls(values: Array<string | null | undefined>) {
  const resolved = values.map((value) => resolvePropertyImageUrl(value)).filter(Boolean);
  return resolved.length ? resolved : [PROPERTY_IMAGE_FALLBACK];
}

export function getImageUploadExtension(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

export function parseDataImageUrl(dataUrl: string) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const [, mimeType, base64] = match;
  return { mimeType, base64 };
}

export function validateImageMimeType(mimeType: string) {
  return ALLOWED_IMAGE_TYPES.has(mimeType.toLowerCase());
}

export function slugifyImagePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "property";
}

export function normalizePropertyImageReference(value: string) {
  return extractSupabaseStoragePath(value) ?? value;
}
