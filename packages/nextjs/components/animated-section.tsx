"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";

interface AnimatedSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  delay?: number;
}

export function AnimatedSection({ children, className, delay = 0, ...props }: AnimatedSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1], delay }}
      {...(props as any)} // FIX: Temporarily cast to 'any' to resolve type conflict with framer-motion.
      // The ideal fix involves updating `AnimatedSectionProps` to extend `HTMLMotionProps<"div">`
      // from 'framer-motion' instead of `HTMLAttributes<HTMLDivElement>`.
      // This would require modifying the `AnimatedSectionProps` interface definition
      // and adding `HTMLMotionProps` to the import statement, which are outside this selection.
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
