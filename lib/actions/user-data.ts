"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { isTrustedOrigin, publicErrorMessage, sanitizeMultilineText, sanitizeSingleLineText } from "@/lib/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const inquirySchema = z.object({
  propertyId: z.string().uuid().optional(),
  message: z.string().min(10).max(1200),
  whatsappNumber: z.string().min(8).max(24)
});

const searchSchema = z.object({
  query: z.string().max(120).optional(),
  region: z.string().max(80).optional(),
  university: z.string().max(120).optional(),
  roomType: z.string().max(40).optional()
});

export async function createInquiryAction({
  propertyId,
  message,
  whatsappNumber
}: {
  propertyId?: string;
  message: string;
  whatsappNumber: string;
}) {
  const requestHeaders = await headers();
  if (!isTrustedOrigin(requestHeaders)) {
    return { ok: false, message: "Invalid request origin." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase is not configured." };

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const validation = inquirySchema.safeParse({
    propertyId,
    message: sanitizeMultilineText(message, 1200),
    whatsappNumber: sanitizeSingleLineText(whatsappNumber, 24)
  });

  if (!validation.success) {
    return { ok: false, message: validation.error.issues[0]?.message ?? "Invalid inquiry details." };
  }

  const rateLimit = consumeRateLimit(`inquiry:${user?.id ?? "anonymous"}`, { limit: 4, windowMs: 60_000 });
  if (!rateLimit.ok) {
    return { ok: false, message: "Too many inquiry attempts. Please wait a minute and try again." };
  }

  const { error } = await supabase.from("inquiries").insert({
    user_id: user?.id ?? null,
    property_id: validation.data.propertyId ?? null,
    message: validation.data.message,
    whatsapp_number: validation.data.whatsappNumber
  });

  if (error) return { ok: false, message: publicErrorMessage(error, "Unable to save your inquiry right now.") };

  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}

export async function trackPropertyViewAction(propertyId: string) {
  const requestHeaders = await headers();
  if (!isTrustedOrigin(requestHeaders)) return { ok: false };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false };

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { ok: false };

  await supabase.from("recent_views").insert({
    user_id: user.id,
    property_id: propertyId
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function trackSearchAction({
  query,
  region,
  university,
  roomType
}: {
  query?: string;
  region?: string;
  university?: string;
  roomType?: string;
}) {
  const requestHeaders = await headers();
  if (!isTrustedOrigin(requestHeaders)) return { ok: false };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false };

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { ok: false };

  const validation = searchSchema.safeParse({
    query: query ? sanitizeSingleLineText(query, 120) : undefined,
    region: region ? sanitizeSingleLineText(region, 80) : undefined,
    university: university ? sanitizeSingleLineText(university, 120) : undefined,
    roomType: roomType ? sanitizeSingleLineText(roomType, 40) : undefined
  });

  if (!validation.success) return { ok: false };

  await supabase.from("search_history").insert({
    user_id: user.id,
    query: validation.data.query || null,
    region: validation.data.region || null,
    university: validation.data.university || null,
    room_type: validation.data.roomType || null
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
