"use client";

import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("settings");
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-sm text-slate-500">{t("description")}</p>
    </div>
  );
}
