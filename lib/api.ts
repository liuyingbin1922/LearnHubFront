import { toast } from "sonner";
import { getToken } from "./auth";

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

type ApiError = {
  message: string;
  status?: number;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    const error = { message: "Missing API base URL" } satisfies ApiError;
    toast.error(error.message);
    return { data: null as T | null, error };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (options.auth !== false) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.message ?? "请求失败，请稍后再试";
      const error = { message, status: response.status } satisfies ApiError;
      toast.error(error.message);
      return { data: null as T | null, error };
    }

    return { data: payload as T, error: null as ApiError | null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "网络异常";
    const apiError = { message } satisfies ApiError;
    toast.error(apiError.message);
    return { data: null as T | null, error: apiError };
  }
}
