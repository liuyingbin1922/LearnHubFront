import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Collection } from "@/types/api";

export function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Card className="flex h-full flex-col justify-between p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{collection.name}</h3>
          <p className="mt-1 text-sm text-slate-500">共 {collection.problem_count ?? 0} 道题</p>
        </div>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
        <span>最近更新</span>
        <Badge variant="outline">{collection.updated_at ?? "刚刚"}</Badge>
      </div>
    </Card>
  );
}
