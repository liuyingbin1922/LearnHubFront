"use client";

import { useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { hasToken } from "@/lib/auth";
import { defaultLocale, isLocale } from "@/lib/i18n";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const localeParam = typeof params.locale === "string" ? params.locale : null;
  const locale = localeParam && isLocale(localeParam) ? localeParam : defaultLocale;

  useEffect(() => {
    if (!hasToken()) {
      const next = encodeURIComponent(pathname ?? `/${locale}/collections`);
      router.replace(`/${locale}/login?next=${next}`);
    }
  }, [locale, pathname, router]);

  return <>{children}</>;
}
