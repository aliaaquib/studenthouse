import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { motionEase } from "@/components/motion";
import { cn } from "@/lib/utils";

export function Toast({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.2, ease: motionEase }}
      className={cn("motion-surface theme-transition inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-[13px] font-medium text-[var(--muted-strong)] shadow-[var(--shadow-card)]", className)}
    >
      <CheckCircle2 size={16} color="var(--primary)" />
      {children}
    </motion.div>
  );
}
