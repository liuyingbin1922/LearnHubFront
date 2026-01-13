"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Problem } from "@/types/api";

export function ProblemCard({ problem, formattedDate }: { problem: Problem; formattedDate: string }) {
  const t = useTranslations("problems");
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-xl bg-slate-100" />
        <div className="flex-1">
          <p className="line-clamp-2 text-sm text-slate-600">{problem.ocr_text ?? t("ocrEmpty")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(problem.tags ?? []).map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{formattedDate}</span>
        <Badge>{problem.status ?? "OCR_DONE"}</Badge>
      </div>
    </Card>
  );
}
