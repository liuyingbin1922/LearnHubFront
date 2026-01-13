import { DEFAULT_REGION } from "@/lib/config";
import type { Locale } from "@/lib/i18n";

export type Region = "global" | "cn";

const REGION_KEY = "learnhub_region";

export function getStoredRegion(): Region | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(REGION_KEY);
  return value === "global" || value === "cn" ? value : null;
}

export function setStoredRegion(region: Region) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REGION_KEY, region);
}

export function getRegionFromLocale(locale: Locale): Region {
  return locale === "zh" ? "cn" : "global";
}

export function getDefaultRegion(): Region {
  return DEFAULT_REGION === "cn" || DEFAULT_REGION === "global" ? DEFAULT_REGION : "global";
}

export function resolveRegion({
  regionParam,
  locale
}: {
  regionParam?: string | null;
  locale: Locale;
}): Region {
  if (regionParam === "cn" || regionParam === "global") {
    return regionParam;
  }

  if (typeof window !== "undefined") {
    const stored = getStoredRegion();
    if (stored) return stored;
  }

  return getRegionFromLocale(locale) ?? getDefaultRegion();
}
