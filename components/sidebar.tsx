"use client";

import Link from "next/link";
import { BookOpen, LayoutGrid, Settings, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { defaultLocale, isLocale } from "@/lib/i18n";

export function Sidebar({ className }: { className?: string }) {
  const t = useTranslations("app");
  const params = useParams();
  const localeParam = typeof params.locale === "string" ? params.locale : null;
  const locale = localeParam && isLocale(localeParam) ? localeParam : defaultLocale;
  const navItems = [
    { href: `/${locale}/collections`, label: t("collections"), icon: LayoutGrid },
    { href: `/${locale}/workflows`, label: t("workflows"), icon: Sparkles },
    { href: `/${locale}/settings`, label: t("settings"), icon: Settings }
  ];

  return (
    <aside className={cn("hidden w-64 flex-col gap-2 border-r border-slate-200 bg-white px-4 py-6 lg:flex", className)}>
      <div className="flex items-center gap-2 px-2 text-xs uppercase text-slate-400">
        <BookOpen className="h-4 w-4" />
        {t("navigation")}
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
