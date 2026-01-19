"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { JobProgress } from "@/components/job-progress";
import { PageHeader } from "@/components/page-header";
import { TagInput } from "@/components/tag-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import type { Job, Problem } from "@/types/api";

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const problemId = params.id as string;
  const [tab, setTab] = useState("content");
  const [tags, setTags] = useState<string[]>([]);
  const [ocrText, setOcrText] = useState("");
  const [note, setNote] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [collectionId, setCollectionId] = useState("");
  const [version, setVersion] = useState<number | null>(null);
  const [imageMode, setImageMode] = useState<"cropped" | "original">("cropped");
  const [ocrJobId, setOcrJobId] = useState<string | null>(null);

  const { data: problem } = useQuery({
    queryKey: ["problems", problemId],
    queryFn: async () => {
      const response = await apiFetch<Problem>(`/api/v1/problems/${problemId}`);
      return response.data ?? null;
    }
  });

  useEffect(() => {
    if (!problem) return;
    setOcrText(problem.ocr_text ?? "");
    setNote(problem.note ?? "");
    setOrderIndex(problem.order_index ?? 0);
    setCollectionId(problem.collection_id ?? "");
    setVersion(problem.version ?? null);
    setTags(Array.isArray(problem.tags) ? problem.tags : []);
    setImageMode(problem.cropped_image_url ? "cropped" : "original");
  }, [problem]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (version === null) {
        throw new Error("版本号缺失，请刷新重试");
      }
      const response = await apiFetch<{ id: string; version: number }>(`/api/v1/problems/${problemId}`, {
        method: "PATCH",
        body: {
          ocr_text: ocrText || null,
          note: note || null,
          tags,
          order_index: orderIndex,
          collection_id: collectionId || null,
          version
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.version !== undefined) {
        setVersion(data.version);
      }
      queryClient.invalidateQueries({ queryKey: ["problems", problemId] });
      toast.success("已保存更新");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "保存失败");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch<{ deleted: boolean }>(`/api/v1/problems/${problemId}`, {
        method: "DELETE"
      });
      return response.data;
    },
    onSuccess: () => {
      const target = collectionId ? `/collections/${collectionId}` : "/collections";
      router.push(target);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "删除失败");
    }
  });

  const ocrMutation = useMutation({
    mutationFn: async () => {
      const imageUrl = problem?.cropped_image_url || problem?.original_image_url;
      if (!imageUrl) {
        throw new Error("缺少图片地址");
      }
      const response = await apiFetch<{ job_id: string }>(`/api/v1/problems/${problemId}/ocr`, {
        method: "POST",
        body: { image_url: imageUrl }
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.job_id) {
        setOcrJobId(data.job_id);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "OCR 任务创建失败");
    }
  });

  const { data: ocrJob } = useQuery({
    queryKey: ["jobs", ocrJobId],
    enabled: Boolean(ocrJobId),
    queryFn: async () => {
      const response = await apiFetch<Job>(`/api/v1/jobs/${ocrJobId}`);
      return response.data ?? null;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && ["success", "failed"].includes(status) ? false : 3000;
    }
  });

  useEffect(() => {
    if (ocrJob?.status === "success") {
      queryClient.invalidateQueries({ queryKey: ["problems", problemId] });
    }
  }, [ocrJob?.status, problemId, queryClient]);

  const currentImage = useMemo(() => {
    if (imageMode === "cropped") return problem?.cropped_image_url ?? problem?.original_image_url;
    return problem?.original_image_url ?? problem?.cropped_image_url;
  }, [imageMode, problem]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`题目 ${problemId}`}
        description="查看题目详情与分析"
        actions={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => ocrMutation.mutate()}
              disabled={!problem || ocrMutation.isPending}
            >
              <Sparkles className="mr-2 h-4 w-4" />一键分析
            </Button>
            <Button variant="outline">
              <RefreshCcw className="mr-2 h-4 w-4" />刷新相似题
            </Button>
            <Button
              variant="ghost"
              className="text-red-500"
              onClick={() => {
                if (!window.confirm("确认删除该题目吗？")) return;
                deleteMutation.mutate();
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />删除
            </Button>
          </div>
        }
      />

      {ocrJob ? <JobProgress status={ocrJob.status} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-6">
          <div className="flex gap-3 text-sm">
            <Button variant={imageMode === "cropped" ? "secondary" : "outline"} onClick={() => setImageMode("cropped")}>
              裁剪图
            </Button>
            <Button variant={imageMode === "original" ? "secondary" : "outline"} onClick={() => setImageMode("original")}>
              原图
            </Button>
          </div>
          {currentImage ? (
            <img src={currentImage} alt="题目图片" className="mt-4 h-96 w-full rounded-2xl object-contain bg-slate-50" />
          ) : (
            <div className="mt-4 h-96 rounded-2xl bg-slate-100" />
          )}
        </Card>
        <Card className="p-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="content">内容</TabsTrigger>
              <TabsTrigger value="insight">洞察</TabsTrigger>
              <TabsTrigger value="links">关联</TabsTrigger>
            </TabsList>
            <TabsContent value="content">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-600">OCR 文本</label>
                  <Textarea className="mt-2" placeholder="识别文本" value={ocrText} onChange={(e) => setOcrText(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-slate-600">备注</label>
                  <Textarea className="mt-2" placeholder="补充解题思路" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-slate-600">标签</label>
                  <div className="mt-2">
                    <TagInput value={tags} onChange={setTags} />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-600">排序序号</label>
                  <Input
                    className="mt-2"
                    type="number"
                    value={orderIndex}
                    onChange={(event) => setOrderIndex(Number(event.target.value))}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600">所属错题集</label>
                  <Input className="mt-2" value={collectionId} onChange={(event) => setCollectionId(event.target.value)} />
                </div>
                <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "保存中..." : "保存更新"}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="insight">
              <div className="space-y-4">
                <Textarea placeholder="insight" />
                <Textarea placeholder="stuck point" />
                <Textarea placeholder="thinking steps" />
                <Button>保存洞察</Button>
              </div>
            </TabsContent>
            <TabsContent value="links">
              <div className="space-y-3">
                <Card className="p-4 text-sm text-slate-600">暂无相似题，点击刷新获取。</Card>
                <Card className="p-4 text-sm text-slate-600">变式题位于此处展示。</Card>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
