"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createInquiryAction({
  propertyId,
  message,
  whatsappNumber
}: {
  propertyId?: string;
  message: string;
  whatsappNumber: string;
}) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase is not configured." };

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("inquiries").insert({
    user_id: user?.id ?? null,
    property_id: propertyId ?? null,
    message,
    whatsapp_number: whatsappNumber
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}

export async function trackPropertyViewAction(propertyId: string) {
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
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false };

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { ok: false };

  await supabase.from("search_history").insert({
    user_id: user.id,
    query: query || null,
    region: region || null,
    university: university || null,
    room_type: roomType || null
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
