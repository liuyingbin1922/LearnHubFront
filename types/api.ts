export type AuthUser = {
  id?: string;
  phone?: string;
  nickname?: string;
};

export type AuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
  user?: AuthUser;
};

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

export type WorkflowRun = {
  id: string;
  status: "pending" | "running" | "success" | "failed";
  created_at?: string;
};
