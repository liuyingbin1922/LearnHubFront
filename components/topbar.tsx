"use client";

import { LogOut, Search, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { defaultLocale, isLocale, replaceLocale } from "@/lib/i18n";

export function Topbar() {
  const { user, logout, isAuthed } = useAuth();
  const t = useTranslations("app");
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const params = useParams();
  const localeParam = typeof params.locale === "string" ? params.locale : null;
  const locale = localeParam && isLocale(localeParam) ? localeParam : defaultLocale;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
          LH
        </div>
        <span className="text-lg font-semibold">{t("name")}</span>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input className="pl-9" placeholder={t("searchPlaceholder")} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-sm text-slate-600 sm:block">{user?.phone ?? (isAuthed ? t("signedIn") : t("guest"))}</div>
        <div className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500">
          <label className="mr-2">{t("language")}</label>
          <select
            className="bg-transparent text-xs outline-none"
            value={locale}
            onChange={(event) => {
              const nextLocale = event.target.value;
              if (isLocale(nextLocale)) {
                const query = searchParams.toString();
                const nextPath = replaceLocale(pathname, nextLocale);
                router.push(query ? `${nextPath}?${query}` : nextPath);
              }
            }}
          >
            <option value="en">{t("english")}</option>
            <option value="zh">{t("chinese")}</option>
          </select>
        </div>
        <Button variant="secondary" size="sm">
          <User className="mr-2 h-4 w-4" />
          {t("profile")}
        </Button>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          {t("logout")}
        </Button>
      </div>
    </div>
  );
}
