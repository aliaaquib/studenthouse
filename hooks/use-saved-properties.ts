"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export function useSavedProperties() {
  const router = useRouter();
  const pathname = usePathname();
  const channelId = useId().replace(/:/g, "");
  const { supabase, user } = useAuth();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const visibleSavedIds = useMemo(() => (user ? savedIds : []), [savedIds, user]);
  const savedSet = useMemo(() => new Set(visibleSavedIds), [visibleSavedIds]);
  const loading = Boolean(supabase && user) && loadedUserId !== (user?.id ?? null);

  useEffect(() => {
    if (!supabase || !user) return;

    let alive = true;
    const client = supabase;
    const currentUser = user;

    async function loadFavorites() {
      const { data } = await client.from("favorites").select("property_id").eq("user_id", currentUser.id);
      if (!alive) return;
      setSavedIds((data ?? []).map((item) => item.property_id));
      setLoadedUserId(currentUser.id);
    }

    void loadFavorites();

    const channel = client.channel(`favorites:${currentUser.id}:${channelId}`);
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "favorites",
        filter: `user_id=eq.${currentUser.id}`
      },
      () => {
        void loadFavorites();
      }
    );
    channel.subscribe();

    return () => {
      alive = false;
      void client.removeChannel(channel);
    };
  }, [channelId, supabase, user]);

  async function toggleSaved(id: string) {
    if (!supabase || !user) {
      router.push(`/login?next=${encodeURIComponent(pathname || "/favorites")}`);
      return { requiresAuth: true as const };
    }

    if (savedSet.has(id)) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", id);
      setSavedIds((current) => current.filter((item) => item !== id));
      return { requiresAuth: false as const, saved: false };
    }

    await supabase.from("favorites").insert({ user_id: user.id, property_id: id });
    setSavedIds((current) => current.includes(id) ? current : [...current, id]);
    return { requiresAuth: false as const, saved: true };
  }

  return {
    savedIds: visibleSavedIds,
    savedSet,
    loading,
    isSaved: (id: string) => savedSet.has(id),
    toggleSaved
  };
}
