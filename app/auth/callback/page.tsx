"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    if (!code) return;

    const run = async () => {
      const { data } = await apiFetch<{ token: string }>("/api/v1/auth/exchange", {
        method: "POST",
        body: { code }
      });
      if (data?.token) {
        setToken(data.token);
        router.replace("/collections");
      }
    };

    run();
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 text-sm text-slate-600 shadow-soft">
        正在完成微信登录，请稍候...
      </div>
    </div>
  );
}
