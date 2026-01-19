"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Globe, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { resolveRegion, setStoredRegion, type Region } from "@/lib/region";
import { supabase } from "@/lib/supabase/client";
import type { AuthTokenResponse } from "@/types/api";

const formSchema = z.object({
  phone: z.string().min(6),
  code: z.string().min(4)
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const localeParam = typeof params.locale === "string" ? params.locale : null;
  const locale = localeParam && isLocale(localeParam) ? localeParam : defaultLocale;
  const t = useTranslations();
  const commonT = useTranslations("common");
  const [countdown, setCountdown] = useState(0);
  const [region, setRegion] = useState<Region>(() => resolveRegion({ locale, regionParam: searchParams.get("region") }));
  const nextParam = useMemo(() => searchParams.get("next"), [searchParams]);
  const redirectTarget = nextParam || `/${locale}/collections`;

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

  useEffect(() => {
    setStoredRegion(region);
  }, [region, t]);

  const onSubmit = async (values: FormValues) => {
    const { data } = await apiFetch<AuthTokenResponse>("/api/v1/auth/sms/verify", {
      method: "POST",
      body: values,
      fallbackErrorMessage: commonT("requestFailed"),
      networkErrorMessage: commonT("networkError"),
      missingApiMessage: commonT("missingApi")
    });
    if (data?.access_token) {
      setToken(data.access_token);
      router.push(redirectTarget);
    }
  };

  const sendCode = async (phone: string) => {
    await apiFetch("/api/v1/auth/sms/send", {
      method: "POST",
      body: { phone },
      fallbackErrorMessage: commonT("requestFailed"),
      networkErrorMessage: commonT("networkError"),
      missingApiMessage: commonT("missingApi")
    });
    setCountdown(60);
  };

  const onGoogleLogin = async () => {
    const callbackUrl = new URL(`/${locale}/auth/callback`, window.location.origin);
    if (nextParam) {
      callbackUrl.searchParams.set("next", nextParam);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl.toString() }
    });

    if (error) {
      toast.error(t("auth.googleLoadError"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-2">
        <Card className="hidden flex-col justify-between p-8 lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">LH</div>
              <span className="text-lg font-semibold">{t("app.name")}</span>
            </div>
            <h1 className="mt-6 text-3xl font-semibold text-slate-900">{t("auth.slogan")}</h1>
          </div>
          <ul className="mt-6 space-y-3 text-sm text-slate-600">
            <li>📌 {t("auth.highlights.one")}</li>
            <li>⚡ {t("auth.highlights.two")}</li>
            <li>📊 {t("auth.highlights.three")}</li>
          </ul>
        </Card>
        <Card className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{t("auth.loginTitle")}</h2>
              <p className="mt-2 text-sm text-slate-500">{t("auth.loginSubtitle")}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs text-slate-500">
              <button
                type="button"
                className={`px-3 py-1 rounded-lg ${region === "global" ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}
                onClick={() => setRegion("global")}
              >
                {t("auth.globalTab")}
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-lg ${region === "cn" ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}
                onClick={() => setRegion("cn")}
              >
                {t("auth.cnTab")}
              </button>
            </div>
          </div>

          {region === "global" ? (
            <div className="mt-6 space-y-4">
              <Button className="w-full" onClick={onGoogleLogin}>
                <Globe className="mr-2 h-4 w-4" />
                {t("auth.googleCta")}
              </Button>
              <details className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <summary className="cursor-pointer text-sm text-slate-600">{t("auth.otherMethods")}</summary>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (!API_BASE_URL) {
                        toast.error(commonT("missingApi"));
                        return;
                      }
                      window.location.href = `${API_BASE_URL}/api/v1/auth/wechat/web/authorize`;
                    }}
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    {t("auth.wechatCta")}
                  </Button>
                </div>
              </details>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  if (!API_BASE_URL) {
                    toast.error(commonT("missingApi"));
                    return;
                  }
                  window.location.href = `${API_BASE_URL}/api/v1/auth/wechat/web/authorize`;
                }}
              >
                <QrCode className="mr-2 h-4 w-4" />
                {t("auth.wechatCta")}
              </Button>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">{t("auth.phoneLoginTitle")}</h3>
                <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-600">{t("auth.phoneLabel")}</label>
                    <div className="flex gap-2">
                      <Input className="w-20" value={"+86"} readOnly />
                      <Input placeholder={t("auth.phonePlaceholder")} {...register("phone")} />
                    </div>
                    {errors.phone ? <p className="text-xs text-red-500">{t("auth.phoneError")}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-600">{t("auth.codeLabel")}</label>
                    <div className="flex gap-2">
                      <Input placeholder={t("auth.codePlaceholder")} {...register("code")} />
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={countdown > 0}
                        onClick={() => sendCode(getValues("phone"))}
                      >
                        {countdown > 0 ? t("auth.countdown", { count: countdown }) : t("auth.sendCode")}
                      </Button>
                    </div>
                    {errors.code ? <p className="text-xs text-red-500">{t("auth.codeError")}</p> : null}
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? t("auth.loggingIn") : t("auth.login")}
                  </Button>
                </form>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
            <span>{t("auth.terms")}</span>
            <button
              type="button"
              className="text-slate-600 hover:text-slate-900"
              onClick={() => setRegion(region === "global" ? "cn" : "global")}
            >
              {t("auth.notInRegion")} {t("auth.switchRegion")}
            </button>
          </div>

        </Card>
      </div>
    </div>
  );
}
