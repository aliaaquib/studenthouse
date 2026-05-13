"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { motionEase } from "@/components/motion";

export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: motionEase }}
    >
      {children}
    </motion.div>
  );
}
