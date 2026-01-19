"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderPlus, FolderX } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { CollectionCard } from "@/components/collection-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SkeletonCard } from "@/components/skeleton-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { defaultLocale, isLocale } from "@/lib/i18n";
import type { Collection } from "@/types/api";

export default function CollectionsPage() {
  const t = useTranslations("collections");
  const commonT = useTranslations("common");
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const params = useParams();
  const localeParam = typeof params.locale === "string" ? params.locale : null;
  const locale = localeParam && isLocale(localeParam) ? localeParam : defaultLocale;

  const { data, isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const response = await apiFetch<Collection[]>("/api/v1/collections", {
        fallbackErrorMessage: commonT("requestFailed"),
        networkErrorMessage: commonT("networkError"),
        missingApiMessage: commonT("missingApi")
      });
      return response.data ?? [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (nextName: string) => {
      const response = await apiFetch<Collection>("/api/v1/collections", {
        method: "POST",
        body: { name: nextName },
        fallbackErrorMessage: commonT("requestFailed"),
        networkErrorMessage: commonT("networkError"),
        missingApiMessage: commonT("missingApi")
      });
      return response.data ?? null;
    },
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : commonT("requestFailed"));
    }
  });

  const handleCreate = (overrideName?: string) => {
    const trimmed = (overrideName ?? name).trim();
    if (!trimmed) {
      toast.error("请输入错题集名称");
      return;
    }
    createMutation.mutate(trimmed);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex flex-wrap gap-3">
            <Input
              className="w-48"
              placeholder={t("new")}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Button onClick={() => handleCreate()} disabled={createMutation.isPending}>
              <FolderPlus className="mr-2 h-4 w-4" />
              {t("new")}
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((collection) => (
            <Link key={collection.id} href={`/${locale}/collections/${collection.id}`} className="block">
              <CollectionCard collection={collection} />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          icon={FolderX}
          actionLabel={t("emptyAction")}
          onAction={() => {
            if (name.trim()) {
              handleCreate();
              return;
            }
            const input = window.prompt("请输入错题集名称");
            if (!input) return;
            handleCreate(input);
          }}
        />
      )}
    </div>
  );
}
