"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileDown, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { JobProgress } from "@/components/job-progress";
import { PageHeader } from "@/components/page-header";
import { ProblemCard } from "@/components/problem-card";
import { SkeletonCard } from "@/components/skeleton-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { defaultLocale, isLocale } from "@/lib/i18n";
import type { Collection, Job, Problem } from "@/types/api";

export default function CollectionDetailPage() {
  const params = useParams();
  const t = useTranslations("collections");
  const commonT = useTranslations("common");
  const [query, setQuery] = useState("");
  const collectionId = params.id as string;
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [exportJobId, setExportJobId] = useState<string | null>(null);
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

  useEffect(() => {
    if (collection?.name) {
      setName(collection.name);
    }
  }, [collection?.name]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch<Collection>(`/api/v1/collections/${collectionId}`, {
        method: "PATCH",
        body: { name: name.trim() || null },
        fallbackErrorMessage: commonT("requestFailed"),
        networkErrorMessage: commonT("networkError"),
        missingApiMessage: commonT("missingApi")
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.name) setName(data.name);
      queryClient.invalidateQueries({ queryKey: ["collections", collectionId] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : commonT("requestFailed"));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch<{ deleted: boolean }>(`/api/v1/collections/${collectionId}`, {
        method: "DELETE",
        fallbackErrorMessage: commonT("requestFailed"),
        networkErrorMessage: commonT("networkError"),
        missingApiMessage: commonT("missingApi")
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      window.location.href = `/${locale}/collections`;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "删除失败");
    }
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch<{ job_id: string }>(`/api/v1/collections/${collectionId}/export_pdf`, {
        method: "POST",
        body: {},
        fallbackErrorMessage: commonT("requestFailed"),
        networkErrorMessage: commonT("networkError"),
        missingApiMessage: commonT("missingApi")
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.job_id) {
        setExportJobId(data.job_id);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "导出失败");
    }
  });

  const { data: exportJob } = useQuery({
    queryKey: ["jobs", exportJobId],
    enabled: Boolean(exportJobId),
    queryFn: async () => {
      const response = await apiFetch<Job>(`/api/v1/jobs/${exportJobId}`, {
        fallbackErrorMessage: commonT("requestFailed"),
        networkErrorMessage: commonT("networkError"),
        missingApiMessage: commonT("missingApi")
      });
      return response.data ?? null;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && ["success", "failed"].includes(status) ? false : 3000;
    }
  });

  const filteredProblems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return problems ?? [];
    return (problems ?? []).filter((problem) => problem.ocr_text?.toLowerCase().includes(keyword));
  }, [problems, query]);

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
            <Button variant="outline" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
              <FileDown className="mr-2 h-4 w-4" />
              {t("exportPdf")}
            </Button>
            <Button
              variant="ghost"
              className="text-red-500"
              onClick={() => {
                if (!window.confirm("确认删除该错题集吗？")) return;
                deleteMutation.mutate();
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="max-w-sm"
          placeholder="更新错题集名称"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button
          variant="secondary"
          onClick={() => {
            if (!name.trim()) {
              toast.error("名称不能为空");
              return;
            }
            updateMutation.mutate();
          }}
          disabled={updateMutation.isPending}
        >
          保存名称
        </Button>
      </div>

      {exportJob ? (
        <div className="space-y-2">
          <JobProgress status={exportJob.status} />
          {exportJob.result?.url ? (
            <a
              className="text-sm text-blue-600 hover:underline"
              href={exportJob.result.url as string}
              target="_blank"
              rel="noreferrer"
            >
              下载导出的 PDF
            </a>
          ) : null}
        </div>
      ) : null}

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
              <ProblemCard problem={problem} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
