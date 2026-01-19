export type Collection = {
  id: string;
  name: string;
  problem_count?: number;
  updated_at?: string;
};

export type Problem = {
  id: string;
  status?: string;
  original_image_url?: string;
  cropped_image_url?: string | null;
  ocr_text?: string | null;
  note?: string | null;
  tags?: unknown;
  order_index?: number;
  collection_id?: string | null;
  version?: number;
  updated_at?: string;
};

export type Job = {
  id: string;
  status: string;
  result?: Record<string, unknown> | null;
  error_message?: string | null;
};

export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
  request_id?: string;
};
