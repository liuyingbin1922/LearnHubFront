"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Camera, CheckCircle2, Crop, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { defaultLocale, isLocale } from "@/lib/i18n";

export default function NewProblemPage() {
  const params = useParams();
  const t = useTranslations("newProblem");
  const [activeStep, setActiveStep] = useState(1);
  const collectionId = params.id as string;
  const localeParam = typeof params.locale === "string" ? params.locale : null;
  const locale = localeParam && isLocale(localeParam) ? localeParam : defaultLocale;

  const steps = [
    { id: 1, label: t("stepUpload"), icon: Upload },
    { id: 2, label: t("stepCrop"), icon: Crop },
    { id: 3, label: t("stepOcr"), icon: CheckCircle2 }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description", { id: collectionId })}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/${locale}/collections/${collectionId}`}>{t("back")}</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-4">
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
            <p className="mt-4 text-sm text-slate-600">{t("uploadHint")}</p>
            <Button className="mt-4" variant="secondary">
              {t("chooseImage")}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900">{t("previewTitle")}</h3>
          <div className="mt-4 h-40 rounded-xl bg-slate-100" />
          <div className="mt-4">
            <label className="text-sm text-slate-600">{t("ocrLabel")}</label>
            <Textarea className="mt-2" placeholder={t("ocrPlaceholder")} />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Button>{t("save")}</Button>
            <Button variant="secondary">{t("saveNext")}</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
