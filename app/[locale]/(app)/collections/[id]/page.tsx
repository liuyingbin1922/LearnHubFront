"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileDown, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/page-header";
import { ProblemCard } from "@/components/problem-card";
import { SkeletonCard } from "@/components/skeleton-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { defaultLocale, isLocale } from "@/lib/i18n";
import type { Collection, Problem } from "@/types/api";

export default function CollectionDetailPage() {
  const params = useParams();
  const t = useTranslations("collections");
  const commonT = useTranslations("common");
  const [query, setQuery] = useState("");
  const collectionId = params.id as string;
  const localeParam = typeof params.locale === "string" ? params.locale : null;
  const locale = localeParam && isLocale(localeParam) ? localeParam : defaultLocale;

  const { data: collection } = useQuery({
    queryKey: ["collections", collectionId],
    queryFn: async () => {
      const response = await apiFetch<Collection>(`/api/v1/collections/${collectionId}`, {
        fallbackErrorMessage: commonT("requestFailed"),
        networkErrorMessage: commonT("networkError"),
        missingApiMessage: commonT("missingApi")
      });
      return response.data ?? null;
    }
  });

  const { data: problems, isLoading } = useQuery({
    queryKey: ["collections", collectionId, "problems"],
    queryFn: async () => {
      const response = await apiFetch<Problem[]>(`/api/v1/collections/${collectionId}/problems`, {
        fallbackErrorMessage: commonT("requestFailed"),
        networkErrorMessage: commonT("networkError"),
        missingApiMessage: commonT("missingApi")
      });
      return response.data ?? [];
    }
  });

  const filteredProblems = (problems ?? []).filter((problem) =>
    problem.ocr_text?.toLowerCase().includes(query.toLowerCase())
  );

  const formatter = useMemo(() => new Intl.DateTimeFormat(locale), [locale]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Link href={`/${locale}/collections`} className="flex items-center gap-1 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Link>
      </div>
      <PageHeader
        title={collection?.name ?? t("title")}
        description={t("problemsCount", { count: collection?.problem_count ?? 0 })}
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" asChild>
              <Link href={`/${locale}/collections/${collectionId}/new`}>
                <Plus className="mr-2 h-4 w-4" />
                {t("addProblem")}
              </Link>
            </Button>
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              {t("exportPdf")}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-sm"
          placeholder={t("search")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button variant="outline">{t("sortTime")}</Button>
        <Button variant="outline">{t("filterStatus")}</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredProblems.map((problem) => (
            <Link key={problem.id} href={`/${locale}/problems/${problem.id}`}>
              <ProblemCard
                problem={problem}
                formattedDate={problem.updated_at ? formatter.format(new Date(problem.updated_at)) : "-"}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
