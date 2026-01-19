"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Camera, CheckCircle2, Crop, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { Problem } from "@/types/api";

const steps = [
  { id: 1, label: "上传图片", icon: Upload },
  { id: 2, label: "裁剪区域", icon: Crop },
  { id: 3, label: "OCR 编辑", icon: CheckCircle2 }
];

export default function NewProblemPage() {
  const params = useParams();
  const [activeStep, setActiveStep] = useState(1);
  const collectionId = params.id as string;
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("请选择图片");

      const presign = await apiFetch<{
        object_key: string;
        url: string;
        headers?: Record<string, string>;
        fields?: Record<string, string>;
        method?: string;
      }>("/api/v1/uploads/presign", {
        method: "POST",
        body: {
          filename: file.name,
          content_type: file.type || "application/octet-stream",
          size: file.size
        }
      });

      if (!presign.data) throw new Error("获取上传地址失败");

      const { object_key: objectKey, url, headers, fields, method } = presign.data;
      if (!objectKey || !url) throw new Error("上传地址不完整");

      if (fields) {
        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
        formData.append("file", file);
        const uploadResponse = await fetch(url, { method: "POST", body: formData });
        if (!uploadResponse.ok) {
          throw new Error("文件上传失败");
        }
      } else {
        const uploadResponse = await fetch(url, {
          method: method ?? "PUT",
          headers,
          body: file
        });
        if (!uploadResponse.ok) {
          throw new Error("文件上传失败");
        }
      }

      const complete = await apiFetch<{ url: string }>("/api/v1/uploads/complete", {
        method: "POST",
        body: { object_key: objectKey }
      });

      if (!complete.data?.url) throw new Error("获取文件地址失败");

      return complete.data.url;
    },
    onSuccess: (url) => {
      setUploadUrl(url);
      toast.success("上传成功");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "上传失败");
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!uploadUrl) throw new Error("请先上传图片");
      const response = await apiFetch<{ id: string } | Problem>("/api/v1/problems", {
        method: "POST",
        body: {
          collection_id: collectionId,
          original_image_url: uploadUrl,
          cropped_image_url: null,
          order_index: 0
        }
      });
      return response.data;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "保存失败");
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="新增错题"
        description={`归档到错题集 ${collectionId}`}
        actions={
          <Button variant="outline" onClick={() => router.push(`/collections/${collectionId}`)}>
            返回列表
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            {steps.map((step) => (
              <button
                key={step.id}
                type="button"
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                  activeStep === step.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}
                onClick={() => setActiveStep(step.id)}
              >
                <step.icon className="h-4 w-4" />
                {step.label}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <Camera className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-4 text-sm text-slate-600">拖拽或点击上传图片（image/*）</p>
            <input
              type="file"
              accept="image/*"
              className="mt-4 block w-full text-sm text-slate-500"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setFile(nextFile);
                setUploadUrl(null);
              }}
            />
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => uploadMutation.mutate()}
              disabled={!file || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "上传中..." : "开始上传"}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900">预览 & OCR</h3>
          {previewUrl ? (
            <img src={previewUrl} alt="上传预览" className="mt-4 h-40 w-full rounded-xl object-cover" />
          ) : (
            <div className="mt-4 h-40 rounded-xl bg-slate-100" />
          )}
          <div className="mt-4">
            <label className="text-sm text-slate-600">OCR 文本</label>
            <Textarea className="mt-2" placeholder="识别结果将在此显示，可手动调整" />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              onClick={async () => {
                try {
                  const data = await createMutation.mutateAsync();
                  const id = data && "id" in data ? data.id : null;
                  if (id) {
                    router.push(`/problems/${id}`);
                  }
                } catch (error) {
                  return;
                }
              }}
              disabled={createMutation.isPending || !uploadUrl}
            >
              {createMutation.isPending ? "保存中..." : "保存到错题集"}
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await createMutation.mutateAsync();
                  setFile(null);
                  setUploadUrl(null);
                } catch (error) {
                  return;
                }
              }}
              disabled={createMutation.isPending || !uploadUrl}
            >
              保存并继续下一题
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
