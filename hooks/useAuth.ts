"use client";

import { useEffect, useState } from "react";
import { clearToken, getToken } from "@/lib/auth";
import type { AuthUser } from "@/types/api";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const token = getToken();
    setIsAuthed(Boolean(token));
    if (token) {
      setUser(null);
    }
  }, []);

  const logout = () => {
    clearToken();
    setIsAuthed(false);
    setUser(null);
  };

  return { isAuthed, user, logout };
}
