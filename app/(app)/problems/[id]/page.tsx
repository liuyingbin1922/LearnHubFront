"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { RefreshCcw, Sparkles, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TagInput } from "@/components/tag-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProblemDetailPage() {
  const params = useParams();
  const problemId = params.id as string;
  const [tab, setTab] = useState("content");
  const [tags, setTags] = useState<string[]>(["代数", "函数"]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`题目 ${problemId}`}
        description="查看题目详情与分析"
        actions={
          <div className="flex gap-3">
            <Button variant="secondary">
              <Sparkles className="mr-2 h-4 w-4" />一键分析
            </Button>
            <Button variant="outline">
              <RefreshCcw className="mr-2 h-4 w-4" />刷新相似题
            </Button>
            <Button variant="ghost" className="text-red-500">
              <Trash2 className="mr-2 h-4 w-4" />删除
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-6">
          <div className="flex gap-3 text-sm">
            <Button variant="secondary">裁剪图</Button>
            <Button variant="outline">原图</Button>
          </div>
          <div className="mt-4 h-96 rounded-2xl bg-slate-100" />
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
                  <Textarea className="mt-2" placeholder="识别文本" />
                </div>
                <div>
                  <label className="text-sm text-slate-600">备注</label>
                  <Textarea className="mt-2" placeholder="补充解题思路" />
                </div>
                <div>
                  <label className="text-sm text-slate-600">标签</label>
                  <div className="mt-2">
                    <TagInput value={tags} onChange={setTags} />
                  </div>
                </div>
                <Button>保存更新</Button>
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
