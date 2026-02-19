// ============================================================
// AnimatedCard — Motion wrapper for stagger list/grid items
// Added by Agent 6 — PRISM — P4 polish
// ============================================================
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  index?: number;
  className?: string;
}

export function AnimatedCard({ children, index = 0, className = '' }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.06, 0.4),
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
