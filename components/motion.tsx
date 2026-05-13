"use client";

import {
  domAnimation,
  LazyMotion,
  MotionConfig,
  motion,
  type HTMLMotionProps,
  type Variants
} from "framer-motion";
import type { ReactNode } from "react";

export const MotionDiv = motion.div;

export const motionEase = [0.22, 1, 0.36, 1] as const;

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: motionEase }
  }
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.02
    }
  }
};

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.22, ease: motionEase }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

export function Reveal({
  children,
  className,
  amount = 0.2,
  once = true,
  ...props
}: HTMLMotionProps<"div"> & {
  children: ReactNode;
  amount?: number;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
