"use client";

import type { ReactNode } from "react";
import { MotionProvider as InternalMotionProvider } from "@/components/motion";

export function MotionProvider({ children }: { children: ReactNode }) {
  return <InternalMotionProvider>{children}</InternalMotionProvider>;
}
