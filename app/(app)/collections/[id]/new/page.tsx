"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Camera, CheckCircle2, Crop, Upload } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const steps = [
  { id: 1, label: "上传图片", icon: Upload },
  { id: 2, label: "裁剪区域", icon: Crop },
  { id: 3, label: "OCR 编辑", icon: CheckCircle2 }
];

export default function NewProblemPage() {
  const params = useParams();
  const [activeStep, setActiveStep] = useState(1);
  const collectionId = params.id as string;

  return (
    <div className="space-y-6">
      <PageHeader
        title="新增错题"
        description={`归档到错题集 ${collectionId}`}
        actions={<Button variant="outline">返回列表</Button>}
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
            <Button className="mt-4" variant="secondary">
              选择图片
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900">预览 & OCR</h3>
          <div className="mt-4 h-40 rounded-xl bg-slate-100" />
          <div className="mt-4">
            <label className="text-sm text-slate-600">OCR 文本</label>
            <Textarea className="mt-2" placeholder="识别结果将在此显示，可手动调整" />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Button>保存到错题集</Button>
            <Button variant="secondary">保存并继续下一题</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
