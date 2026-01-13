"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { RefreshCcw, Sparkles, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/page-header";
import { TagInput } from "@/components/tag-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProblemDetailPage() {
  const params = useParams();
  const problemId = params.id as string;
  const t = useTranslations("problems");
  const [tab, setTab] = useState("content");
  const [tags, setTags] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title", { id: problemId })}
        description={t("description")}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary">
              <Sparkles className="mr-2 h-4 w-4" />
              {t("analyze")}
            </Button>
            <Button variant="outline">
              <RefreshCcw className="mr-2 h-4 w-4" />
              {t("refresh")}
            </Button>
            <Button variant="ghost" className="text-red-500">
              <Trash2 className="mr-2 h-4 w-4" />
              {t("delete")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-6">
          <div className="flex gap-3 text-sm">
            <Button variant="secondary">{t("cropped")}</Button>
            <Button variant="outline">{t("original")}</Button>
          </div>
          <div className="mt-4 h-96 rounded-2xl bg-slate-100" />
        </Card>
        <Card className="p-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="content">{t("tabContent")}</TabsTrigger>
              <TabsTrigger value="insight">{t("tabInsight")}</TabsTrigger>
              <TabsTrigger value="links">{t("tabLinks")}</TabsTrigger>
            </TabsList>
            <TabsContent value="content">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-600">{t("ocrText")}</label>
                  <Textarea className="mt-2" placeholder={t("ocrText")} />
                </div>
                <div>
                  <label className="text-sm text-slate-600">{t("note")}</label>
                  <Textarea className="mt-2" placeholder={t("note")} />
                </div>
                <div>
                  <label className="text-sm text-slate-600">{t("tags")}</label>
                  <div className="mt-2">
                    <TagInput value={tags} onChange={setTags} />
                  </div>
                </div>
                <Button>{t("save")}</Button>
              </div>
            </TabsContent>
            <TabsContent value="insight">
              <div className="space-y-4">
                <Textarea placeholder={t("insight")} />
                <Textarea placeholder={t("stuckPoint")} />
                <Textarea placeholder={t("thinkingSteps")} />
                <Button>{t("saveInsight")}</Button>
              </div>
            </TabsContent>
            <TabsContent value="links">
              <div className="space-y-3">
                <Card className="p-4 text-sm text-slate-600">{t("noLinks")}</Card>
                <Card className="p-4 text-sm text-slate-600">{t("variantPlaceholder")}</Card>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
