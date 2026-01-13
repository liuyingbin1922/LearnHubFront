import { DEFAULT_LOCALE } from "@/lib/config";

export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const defaultLocale: Locale = isLocale(DEFAULT_LOCALE) ? DEFAULT_LOCALE : "en";

export function replaceLocale(pathname: string, nextLocale: Locale) {
  const segments = pathname.split("/");
  if (segments.length > 1 && isLocale(segments[1])) {
    segments[1] = nextLocale;
    return segments.join("/") || "/";
  }
  return `/${nextLocale}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}
