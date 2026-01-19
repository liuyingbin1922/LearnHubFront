"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { clearToken, getToken } from "@/lib/auth";

export type AuthUser = {
  id?: string;
  email?: string;
  name?: string;
  image?: string;
  phone?: string;
};

const mapSupabaseUser = (user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }): AuthUser => {
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? undefined,
    name: typeof metadata.full_name === "string" ? metadata.full_name : undefined,
    image: typeof metadata.avatar_url === "string" ? metadata.avatar_url : undefined
  };
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;
      if (!isMounted) return;

      if (sessionUser) {
        setUser(mapSupabaseUser(sessionUser));
        setIsAuthed(true);
        setIsLoading(false);
        return;
      }

      const token = getToken();
      if (token) {
        setUser({ phone: "已登录用户" });
        setIsAuthed(true);
      } else {
        setUser(null);
        setIsAuthed(false);
      }
      setIsLoading(false);
    };

    syncSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        setIsAuthed(true);
      } else {
        const token = getToken();
        if (token) {
          setUser({ phone: "已登录用户" });
          setIsAuthed(true);
        } else {
          setUser(null);
          setIsAuthed(false);
        }
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    clearToken();
    setIsAuthed(false);
    setUser(null);
  };

  return { isAuthed, isLoading, user, logout };
}
