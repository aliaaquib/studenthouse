import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-border rounded-[16px] bg-[var(--card)]", className)} {...props} />;
}
