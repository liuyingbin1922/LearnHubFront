"use client";

import { LogOut, Search, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { getDefaultRegion, getRegionFromHostname } from "@/lib/region";
import { supabase } from "@/lib/supabase/client";

export function Topbar() {
  const { user, isAuthed, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const locale = (() => {
    const segment = pathname?.split("/")[1];
    return segment && isLocale(segment) ? segment : defaultLocale;
  })();

  const handleProfileClick = async () => {
    if (isAuthed) {
      router.push(`/${locale}/settings`);
      return;
    }

    const region = typeof window !== "undefined" ? getRegionFromHostname(window.location.hostname) ?? getDefaultRegion() : "global";
    const next = pathname || `/${locale}/collections`;

    if (region === "global") {
      const callbackUrl = new URL(`/${locale}/auth/callback`, window.location.origin);
      callbackUrl.searchParams.set("next", next);
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl.toString() }
      });
      return;
    }

    router.push(`/${locale}/login?region=cn&next=${encodeURIComponent(next)}`);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
          LH
        </div>
        <span className="text-lg font-semibold">LearnHub</span>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input className="pl-9" placeholder="搜索错题、标签、集合" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-sm text-slate-600 sm:block">{user?.name ?? user?.email ?? user?.phone ?? "未登录"}</div>
        <Button variant="secondary" size="sm" onClick={handleProfileClick}>
          <User className="mr-2 h-4 w-4" />
          个人中心
        </Button>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          退出
        </Button>
      </div>
    </div>
  );
}
