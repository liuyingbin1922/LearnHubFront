"use client";

import { useEffect, useState } from "react";
import { clearToken, getToken } from "@/lib/auth";

export type AuthUser = {
  id?: string;
  phone?: string;
  nickname?: string;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const token = getToken();
    setIsAuthed(Boolean(token));
    if (token) {
      setUser({ phone: "已登录用户" });
    }
  }, []);

  const logout = () => {
    clearToken();
    setIsAuthed(false);
    setUser(null);
  };

  return { isAuthed, user, logout };
}
