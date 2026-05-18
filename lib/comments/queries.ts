import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchPropertyCommentsWithClient } from "@/lib/comments/utils";

export async function getPropertyComments(propertyId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const {
    data: { user }
  } = await supabase.auth.getUser();

  try {
    return await fetchPropertyCommentsWithClient(supabase, propertyId, user?.id ?? null);
  } catch {
    return [];
  }
}
