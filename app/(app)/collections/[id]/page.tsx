"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileDown, Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ProblemCard } from "@/components/problem-card";
import { SkeletonCard } from "@/components/skeleton-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import type { Collection, Problem } from "@/types/api";

export default function CollectionDetailPage() {
  const params = useParams();
  const [query, setQuery] = useState("");
  const collectionId = params.id as string;

  const { data: collection } = useQuery({
    queryKey: ["collections", collectionId],
    queryFn: async () => {
      const response = await apiFetch<Collection>(`/api/v1/collections/${collectionId}`);
      return response.data ?? null;
    }
  });

  const { data: problems, isLoading } = useQuery({
    queryKey: ["collections", collectionId, "problems"],
    queryFn: async () => {
      const response = await apiFetch<Problem[]>(`/api/v1/collections/${collectionId}/problems`);
      return response.data ?? [];
    }
  });

  const filteredProblems = (problems ?? []).filter((problem) =>
    problem.ocr_text?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Link href="/collections" className="flex items-center gap-1 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          返回
        </Link>
      </div>
      <PageHeader
        title={collection?.name ?? "错题集"}
        description={`共 ${collection?.problem_count ?? 0} 道题`}
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" asChild>
              <Link href={`/collections/${collectionId}/new`}>
                <Plus className="mr-2 h-4 w-4" />新增错题
              </Link>
            </Button>
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />导出 PDF
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-sm"
          placeholder="搜索错题"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button variant="outline">按时间排序</Button>
        <Button variant="outline">按状态过滤</Button>
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
            <Link key={problem.id} href={`/problems/${problem.id}`}>
              <ProblemCard problem={problem} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
