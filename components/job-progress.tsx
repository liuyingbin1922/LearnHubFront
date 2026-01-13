import { Badge } from "@/components/ui/badge";

export function JobProgress({ status, progress }: { status: string; progress?: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-soft">
      <span>任务状态：{status}</span>
      <Badge variant="outline">{progress ? `${progress}%` : "处理中"}</Badge>
    </div>
  );
}
