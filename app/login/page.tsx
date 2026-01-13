"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { setToken } from "@/lib/auth";

const formSchema = z.object({
  phone: z.string().min(11, "请输入手机号"),
  code: z.string().min(4, "请输入验证码")
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(0);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      code: ""
    }
  });

  useEffect(() => {
    if (!countdown) return;
    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  const sendCode = async (phone: string) => {
    await apiFetch("/api/v1/auth/sms/send", {
      method: "POST",
      body: { phone }
    });
    setCountdown(60);
  };

  const onSubmit = async (values: FormValues) => {
    const { data } = await apiFetch<{ token: string }>("/api/v1/auth/sms/verify", {
      method: "POST",
      body: values
    });
    if (data?.token) {
      setToken(data.token);
      router.push("/collections");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-2">
        <Card className="hidden flex-col justify-between p-8 lg:flex">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">学习不再碎片化</h1>
            <p className="mt-3 text-sm text-slate-600">集中管理错题与洞察，让每次练习都有复盘。</p>
          </div>
          <ul className="mt-6 space-y-3 text-sm text-slate-600">
            <li>📌 自动归档错题与标签</li>
            <li>⚡ 一键分析相似题与变式</li>
            <li>📊 可视化复习进度</li>
          </ul>
        </Card>
        <Card className="p-8">
          <h2 className="text-xl font-semibold text-slate-900">手机号登录</h2>
          <p className="mt-2 text-sm text-slate-500">使用短信验证码快速登录</p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">手机号</label>
              <div className="flex gap-2">
                <Input className="w-20" value={"+86"} readOnly />
                <Input placeholder="请输入手机号" {...register("phone")} />
              </div>
              {errors.phone ? <p className="text-xs text-red-500">{errors.phone.message}</p> : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">验证码</label>
              <div className="flex gap-2">
                <Input placeholder="输入验证码" {...register("code")} />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={countdown > 0}
                  onClick={() => sendCode(getValues("phone"))}
                >
                  {countdown > 0 ? `${countdown}s` : "发送验证码"}
                </Button>
              </div>
              {errors.code ? <p className="text-xs text-red-500">{errors.code.message}</p> : null}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "登录中..." : "登录"}
            </Button>
          </form>
          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            或者
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/wechat/web/authorize`;
            }}
          >
            微信扫码登录
          </Button>
        </Card>
      </div>
    </div>
  );
}
