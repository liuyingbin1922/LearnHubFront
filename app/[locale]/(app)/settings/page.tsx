"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";

type Profile = {
  id: string;
  nickname?: string;
  avatar_url?: string | null;
  email?: string | null;
};

export default function SettingsPage() {
  const t = useTranslations("settings");
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await apiFetch<Profile>("/api/v1/me");
      return response.data ?? null;
    }
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-sm text-slate-500">{t("description")}</p>
      <div className="mt-6 grid gap-4 text-sm text-slate-600">
        {isLoading ? (
          <span>加载中...</span>
        ) : data ? (
          <>
            <div>用户 ID：{data.id}</div>
            <div>昵称：{data.nickname ?? "-"}</div>
            <div>邮箱：{data.email ?? "-"}</div>
          </>
        ) : (
          <span>暂无用户信息</span>
        )}
      </div>
    </div>
  );
}
