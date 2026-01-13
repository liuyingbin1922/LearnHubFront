"use client";

import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Collection } from "@/types/api";

export function CollectionCard({ collection, formattedDate }: { collection: Collection; formattedDate: string }) {
  const t = useTranslations("collections");

  return (
    <Card className="flex h-full flex-col justify-between p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{collection.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{t("problemsCount", { count: collection.problem_count ?? 0 })}</p>
        </div>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
        <span>{t("recentUpdate")}</span>
        <Badge variant="outline">{formattedDate}</Badge>
      </div>
    </Card>
  );
}
