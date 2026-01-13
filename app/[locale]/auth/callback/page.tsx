"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { defaultLocale, isLocale } from "@/lib/i18n";
import type { AuthTokenResponse } from "@/types/api";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const commonT = useTranslations("common");
  const localeParam = typeof params.locale === "string" ? params.locale : null;
  const locale = localeParam && isLocale(localeParam) ? localeParam : defaultLocale;
  const [error, setError] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const idToken = searchParams.get("id_token");

    const run = async () => {
      if (code) {
        const { data } = await apiFetch<AuthTokenResponse>("/api/v1/auth/exchange", {
          method: "POST",
          body: { code },
          fallbackErrorMessage: commonT("requestFailed"),
          networkErrorMessage: commonT("networkError"),
          missingApiMessage: commonT("missingApi")
        });
        if (data?.access_token) {
          setToken(data.access_token);
          router.replace(`/${locale}/collections`);
        } else {
          setError(true);
        }
        return;
      }

      if (idToken) {
        const { data } = await apiFetch<AuthTokenResponse>("/api/v1/auth/google/verify", {
          method: "POST",
          body: { id_token: idToken },
          fallbackErrorMessage: commonT("requestFailed"),
          networkErrorMessage: commonT("networkError"),
          missingApiMessage: commonT("missingApi")
        });
        if (data?.access_token) {
          setToken(data.access_token);
          router.replace(`/${locale}/collections`);
        } else {
          setError(true);
        }
        return;
      }

      setError(true);
    };

    run();
  }, [locale, router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-sm p-6 text-center">
        <h1 className="text-base font-semibold text-slate-900">{error ? t("auth.callbackFailed") : t("auth.callbackTitle")}</h1>
        {error ? (
          <div className="mt-4 flex flex-col gap-2">
            <Button onClick={() => router.refresh()}>{t("auth.callbackRetry")}</Button>
            <Button variant="outline" onClick={() => router.replace(`/${locale}/login`)}>
              {t("auth.callbackBack")}
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{t("common.processing")}</p>
        )}
      </Card>
    </div>
  );
}
