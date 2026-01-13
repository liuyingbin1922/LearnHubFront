"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

export function JobProgress({ status, progress }: { status: string; progress?: number }) {
  const t = useTranslations("common");
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-soft">
      <span>{status}</span>
      <Badge variant="outline">{progress ? `${progress}%` : t("processing")}</Badge>
    </div>
  );
}
