import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Problem } from "@/types/api";

export function ProblemCard({ problem }: { problem: Problem }) {
  const tags = Array.isArray(problem.tags) ? problem.tags : [];

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-4">
        {problem.original_image_url ? (
          <img
            src={problem.original_image_url}
            alt="题目缩略图"
            className="h-16 w-16 rounded-xl object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded-xl bg-slate-100" />
        )}
        <div className="flex-1">
          <p className="line-clamp-2 text-sm text-slate-600">{problem.ocr_text ?? "暂无 OCR 摘要"}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(tags.length ? tags : ["代数", "函数"]).map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{problem.updated_at ?? "刚刚"}</span>
        <Badge>{problem.status ?? "OCR_DONE"}</Badge>
      </div>
    </Card>
  );
}
