import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "focus-ring h-12 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 text-[14px] font-medium text-[var(--foreground)] placeholder:text-[var(--muted)]",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
