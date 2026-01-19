import { CN_BASE_URL, DEFAULT_REGION, GLOBAL_BASE_URL, REGION_HOSTS } from "@/lib/config";
import type { Locale } from "@/lib/i18n";

export type Region = "global" | "cn";

const REGION_KEY = "learnhub_region";

const parseRegionHosts = (value: string): Record<Region, string[]> => {
  const result: Record<Region, string[]> = { global: [], cn: [] };
  value
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .forEach((segment) => {
      const [region, hosts] = segment.split("=");
      if (!hosts) return;
      if (region !== "global" && region !== "cn") return;
      const list = hosts
        .split(",")
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean);
      result[region] = list;
    });
  return result;
};

const REGION_HOST_MAP = parseRegionHosts(REGION_HOSTS);

export function getRegionFromHostname(hostname: string): Region | null {
  const normalized = hostname.toLowerCase();
  if (REGION_HOST_MAP.global.includes(normalized)) return "global";
  if (REGION_HOST_MAP.cn.includes(normalized)) return "cn";
  if (normalized.endsWith(".cn")) return "cn";
  return null;
}

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
    const hostRegion = getRegionFromHostname(window.location.hostname);
    if (hostRegion) return hostRegion;
    const stored = getStoredRegion();
    if (stored) return stored;
  }

  return getRegionFromLocale(locale) ?? getDefaultRegion();
}

export function getRegionBaseUrl(region: Region): string | null {
  const url = region === "cn" ? CN_BASE_URL : GLOBAL_BASE_URL;
  return url ? url.replace(/\/$/, "") : null;
}
