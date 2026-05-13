"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Toast } from "@/components/ui/toast";
import { useAuth } from "@/components/providers/auth-provider";

type SavedPropertiesContextValue = {
  savedIds: string[];
  savedSet: Set<string>;
  loading: boolean;
  isSaved: (id: string) => boolean;
  isPending: (id: string) => boolean;
  toggleSaved: (id: string) => Promise<{ requiresAuth: boolean; saved?: boolean; error?: string }>;
};

const SavedPropertiesContext = createContext<SavedPropertiesContextValue | null>(null);

export function SavedPropertiesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { supabase, user, loading: authLoading } = useAuth();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string>("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loading = Boolean(supabase) && (authLoading || (!!user && loadedUserId !== user.id));
  const savedSet = useMemo(() => new Set(user ? savedIds : []), [savedIds, user]);
  const pendingSet = useMemo(() => new Set(pendingIds), [pendingIds]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    if (!user) return;

    let alive = true;
    const client = supabase;
    const currentUser = user;

    async function loadFavorites() {
      const { data, error } = await client
        .from("favorites")
        .select("property_id")
        .eq("user_id", currentUser.id);

      if (!alive || error) return;
      setSavedIds((data ?? []).map((item) => item.property_id));
      setLoadedUserId(currentUser.id);
    }

    void loadFavorites();

    const channel = client.channel(`favorites:${user.id}`);
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
  }, [supabase, user]);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }

  async function toggleSaved(id: string) {
    if (!supabase || !user) {
      router.push(`/login?next=${encodeURIComponent(pathname || "/saved")}`);
      return { requiresAuth: true as const };
    }

    const wasSaved = savedSet.has(id);
    const previousIds = savedIds;

    setPendingIds((current) => (current.includes(id) ? current : [...current, id]));
    setSavedIds((current) =>
      wasSaved ? current.filter((item) => item !== id) : (current.includes(id) ? current : [...current, id])
    );

    try {
      const query = wasSaved
        ? supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", id)
        : supabase.from("favorites").insert({ user_id: user.id, property_id: id });

      const { error } = await query;

      if (error) {
        setSavedIds(previousIds);
        showToast("Something went wrong");
        return { requiresAuth: false as const, error: error.message };
      }

      showToast(
        wasSaved
          ? "Property removed from saved apartments"
          : "Property saved — view it in your account"
      );

      return { requiresAuth: false as const, saved: !wasSaved };
    } catch (error) {
      setSavedIds(previousIds);
      showToast("Something went wrong");
      return {
        requiresAuth: false as const,
        error: error instanceof Error ? error.message : "Something went wrong"
      };
    } finally {
      setPendingIds((current) => current.filter((item) => item !== id));
    }
  }

  return (
    <SavedPropertiesContext.Provider
      value={{
        savedIds: user ? savedIds : [],
        savedSet,
        loading,
        isSaved: (id: string) => savedSet.has(id),
        isPending: (id: string) => pendingSet.has(id),
        toggleSaved
      }}
    >
      {children}
      <div className="pointer-events-none fixed bottom-4 left-4 z-[90]">
        <AnimatePresence>{toast ? <Toast>{toast}</Toast> : null}</AnimatePresence>
      </div>
    </SavedPropertiesContext.Provider>
  );
}

export function useSavedPropertiesContext() {
  const context = useContext(SavedPropertiesContext);
  if (!context) {
    throw new Error("useSavedPropertiesContext must be used within SavedPropertiesProvider");
  }

  return context;
}
