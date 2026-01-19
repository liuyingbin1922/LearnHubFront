"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderPlus, FolderX } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { CollectionCard } from "@/components/collection-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SkeletonCard } from "@/components/skeleton-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import type { Collection } from "@/types/api";

export default function CollectionsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const response = await apiFetch<Collection[]>("/api/v1/collections");
      return response.data ?? [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (nextName: string) => {
      const response = await apiFetch<Collection>("/api/v1/collections", {
        method: "POST",
        body: { name: nextName }
      });
      return response.data;
    },
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "创建失败";
      toast.error(message);
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
        title="错题集"
        description="集中管理你的错题与复习节奏"
        actions={
          <div className="flex flex-wrap gap-3">
            <Input
              className="w-48"
              placeholder="错题集名称"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Button onClick={() => handleCreate()} disabled={createMutation.isPending}>
              <FolderPlus className="mr-2 h-4 w-4" />
              {createMutation.isPending ? "创建中" : "新建错题集"}
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
            <Link key={collection.id} href={`/collections/${collection.id}`} className="block">
              <CollectionCard collection={collection} />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="还没有错题集"
          description="创建第一个错题集，开始整理你的知识漏洞。"
          icon={FolderX}
          actionLabel="创建第一个错题集"
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
