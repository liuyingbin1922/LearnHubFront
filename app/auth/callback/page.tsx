"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    const code = params.get("code");
    const next = params.get("next");

    const run = async () => {
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(true);
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace(next || "/collections");
      } else {
        setError(true);
      }
    };

    run();
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 text-sm text-slate-600 shadow-soft">
        {error ? "登录失败，请重试" : "正在完成 Google 登录，请稍候..."}
      </div>
    </div>
  );
}
