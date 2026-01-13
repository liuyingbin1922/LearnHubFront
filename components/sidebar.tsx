import Link from "next/link";
import { BookOpen, LayoutGrid, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/collections", label: "Collections", icon: LayoutGrid },
  { href: "/workflows", label: "Workflows", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside className={cn("hidden w-64 flex-col gap-2 border-r border-slate-200 bg-white px-4 py-6 lg:flex", className)}>
      <div className="flex items-center gap-2 px-2 text-xs uppercase text-slate-400">
        <BookOpen className="h-4 w-4" />
        导航
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
