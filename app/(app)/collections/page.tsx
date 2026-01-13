"use client";

import { useQuery } from "@tanstack/react-query";
import { FolderPlus, FolderX } from "lucide-react";
import { CollectionCard } from "@/components/collection-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SkeletonCard } from "@/components/skeleton-card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { Collection } from "@/types/api";

export default function CollectionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const response = await apiFetch<Collection[]>("/api/v1/collections");
      return response.data ?? [];
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="错题集"
        description="集中管理你的错题与复习节奏"
        actions={<Button><FolderPlus className="mr-2 h-4 w-4" />新建错题集</Button>}
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
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="还没有错题集"
          description="创建第一个错题集，开始整理你的知识漏洞。"
          icon={FolderX}
          actionLabel="创建第一个错题集"
          onAction={() => undefined}
        />
      )}
    </div>
  );
}
