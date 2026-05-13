"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { AppRole } from "@/lib/rbac";

type AuthProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
};

type AuthContextValue = {
  supabase: SupabaseClient | null;
  user: User | null;
  session: Session | null;
  profile: AuthProfile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  supabase: null,
  user: null,
  session: null,
  profile: null,
  loading: true
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    let alive = true;
    const client = supabase;
    let lastProfileUserId: string | null = null;

    async function loadProfile(nextUser: User | null) {
      if (!nextUser) {
        if (!alive) return;
        setProfile(null);
        setResolved(true);
        lastProfileUserId = null;
        return;
      }

      if (lastProfileUserId === nextUser.id) {
        if (!alive) return;
        setResolved(true);
        return;
      }

      const fallbackProfile: AuthProfile = {
        id: nextUser.id,
        email: nextUser.email ?? "",
        full_name: (nextUser.user_metadata?.full_name as string | undefined) ?? null,
        role: "student"
      };

      const { data, error } = await client
        .from("profiles")
        .select("id, email, full_name, role")
        .eq("id", nextUser.id)
        .maybeSingle();

      if (!alive) return;
      setProfile(error ? fallbackProfile : ((data as AuthProfile | null) ?? fallbackProfile));
      setResolved(true);
      lastProfileUserId = nextUser.id;
    }

    client.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      void loadProfile(data.session?.user ?? null);
    });

    const {
      data: { subscription }
    } = client.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      if (event === "TOKEN_REFRESHED" && nextSession?.user?.id === lastProfileUserId) {
        setResolved(true);
        return;
      }
      setResolved(false);
      void loadProfile(nextSession?.user ?? null);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ supabase, user, session, profile, loading: Boolean(supabase) && !resolved }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
