import { toast } from "sonner";
import { getToken } from "./auth";
import { supabase } from "./supabase/client";

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  fallbackErrorMessage?: string;
  networkErrorMessage?: string;
  missingApiMessage?: string;
};

type ApiError = {
  message: string;
  status?: number;
};

type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
  request_id?: string;
};

const isApiEnvelope = (payload: unknown): payload is ApiEnvelope<unknown> => {
  if (!payload || typeof payload !== "object") return false;
  return "code" in payload && "data" in payload && "message" in payload;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    const error = { message: options.missingApiMessage ?? "Missing API base URL" } satisfies ApiError;
    toast.error(error.message);
    return { data: null as T | null, error };
  }

  const method = options.method ?? "GET";
  const isAuthPath = path.startsWith("/api/v1/auth/");
  const token = getToken();
  let accessToken = token;

  if (!accessToken && typeof window !== "undefined") {
    const { data } = await supabase.auth.getSession();
    accessToken = data.session?.access_token ?? null;
  }

  if (options.auth !== false && !accessToken && !isAuthPath && method !== "GET") {
    const error = { message: "请先登录后再操作" } satisfies ApiError;
    toast.error(error.message);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return { data: null as T | null, error };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (options.auth !== false) {
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const payload = await response.json().catch(() => null);
    const envelope = isApiEnvelope(payload) ? payload : null;

    if (!response.ok || (envelope && envelope.code !== 0)) {
      const message = envelope?.message ?? payload?.message ?? options.fallbackErrorMessage ?? "请求失败，请稍后再试";
      const error = { message, status: response.status } satisfies ApiError;
      toast.error(error.message);
      if (response.status === 401 && (accessToken || method !== "GET") && !isAuthPath && typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return { data: null as T | null, error };
    }

    const data = (envelope ? envelope.data : payload) as T;
    return { data, error: null as ApiError | null };
  } catch (error) {
    const message = error instanceof Error ? error.message : options.networkErrorMessage ?? "网络异常";
    const apiError = { message } satisfies ApiError;
    toast.error(apiError.message);
    return { data: null as T | null, error: apiError };
  }
}
