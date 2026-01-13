"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderPlus, FolderX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { CollectionCard } from "@/components/collection-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SkeletonCard } from "@/components/skeleton-card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { defaultLocale, isLocale } from "@/lib/i18n";
import type { Collection } from "@/types/api";

export default function CollectionsPage() {
  const t = useTranslations("collections");
  const commonT = useTranslations("common");
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

  const formatter = useMemo(() => new Intl.DateTimeFormat(locale), [locale]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button>
            <FolderPlus className="mr-2 h-4 w-4" />
            {t("new")}
          </Button>
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
            <CollectionCard
              key={collection.id}
              collection={collection}
              formattedDate={collection.updated_at ? formatter.format(new Date(collection.updated_at)) : "-"}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          icon={FolderX}
          actionLabel={t("emptyAction")}
          onAction={() => undefined}
        />
      )}
    </div>
  );
}
