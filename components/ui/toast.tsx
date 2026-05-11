import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toast({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-[13px] font-extrabold text-[var(--muted-strong)] shadow-[var(--shadow-card)]", className)}>
      <CheckCircle2 size={16} color="var(--primary)" />
      {children}
    </div>
  );
}
