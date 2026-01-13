"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TagInput({ value = [], onChange }: { value?: string[]; onChange?: (tags: string[]) => void }) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const next = Array.from(new Set([...value, trimmed]));
    onChange?.(next);
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange?.(value.filter((item) => item !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <Badge key={tag} variant="outline" className="gap-1">
            {tag}
            <button type="button" className="text-slate-400" onClick={() => removeTag(tag)}>
              ×
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="输入标签，按回车添加"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={addTag}>
          添加
        </Button>
      </div>
    </div>
  );
}
