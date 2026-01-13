export type Collection = {
  id: string;
  name: string;
  problem_count?: number;
  updated_at?: string;
};

export type Problem = {
  id: string;
  ocr_text?: string;
  status?: string;
  tags?: string[];
  thumbnail_url?: string;
  updated_at?: string;
};

export type Job = {
  id: string;
  status: "pending" | "running" | "success" | "failed";
  progress?: number;
  result?: Record<string, unknown>;
};
