"use client";

import { useState } from "react";
import { Sparkles, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";

export default function WorkflowsPage() {
  const [input, setInput] = useState("");
  const t = useTranslations("workflows");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button>
            <Sparkles className="mr-2 h-4 w-4" />
            {t("cta")}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3 text-sm text-slate-600">{t("uploadHint")}</p>
              <Button className="mt-3" variant="secondary">
                {t("cta")}
              </Button>
            </div>
            <div>
              <label className="text-sm text-slate-600">{t("pasteLabel")}</label>
              <Textarea
                className="mt-2"
                placeholder={t("pastePlaceholder")}
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
            </div>
            <Button className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              {t("cta")}
            </Button>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900">{t("results")}</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <Card className="p-4">{t("resultProblem")}</Card>
            <Card className="p-4">{t("resultSimilar")}</Card>
            <Card className="p-4">{t("resultRecommend")}</Card>
          </div>
        </Card>
      </div>
    </div>
  );
}
