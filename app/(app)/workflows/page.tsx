"use client";

import { useState } from "react";
import { Sparkles, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";

export default function WorkflowsPage() {
  const [input, setInput] = useState("");

  return (
    <div className="space-y-6">
      <PageHeader
        title="一键分析"
        description="上传图片或粘贴题目文本，立即生成相似题与建议"
        actions={
          <Button>
            <Sparkles className="mr-2 h-4 w-4" />一键分析
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3 text-sm text-slate-600">上传题目图片或拖拽到这里</p>
              <Button className="mt-3" variant="secondary">
                选择图片
              </Button>
            </div>
            <div>
              <label className="text-sm text-slate-600">或粘贴文字</label>
              <Textarea
                className="mt-2"
                placeholder="粘贴题目文本..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
            </div>
            <Button className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />开始分析
            </Button>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900">分析结果</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <Card className="p-4">生成的问题卡片将显示在这里。</Card>
            <Card className="p-4">相似题列表（占位）。</Card>
            <Card className="p-4">推荐学习路径（占位）。</Card>
          </div>
        </Card>
      </div>
    </div>
  );
}
