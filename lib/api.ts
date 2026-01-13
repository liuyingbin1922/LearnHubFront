import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/config";
import { getToken } from "./auth";

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

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}) {
  if (!API_BASE_URL) {
    const error = { message: options.missingApiMessage ?? options.fallbackErrorMessage ?? "" } satisfies ApiError;
    if (error.message) {
      toast.error(error.message);
    }
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
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.message ?? options.fallbackErrorMessage ?? "";
      const error = { message, status: response.status } satisfies ApiError;
      if (error.message) {
        toast.error(error.message);
      }
      return { data: null as T | null, error };
    }

    return { data: payload as T, error: null as ApiError | null };
  } catch (error) {
    const message = error instanceof Error ? error.message : options.networkErrorMessage ?? "";
    const apiError = { message } satisfies ApiError;
    if (apiError.message) {
      toast.error(apiError.message);
    }
    return { data: null as T | null, error: apiError };
  }
}
