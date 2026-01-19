"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthed, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthed) {
      router.replace("/login");
    }
  }, [isAuthed, isLoading, router]);

  if (isLoading) {
    return null;
  }

  return <>{children}</>;
}
