import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("rounded bg-[var(--color-border)]", className)}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={i === lines - 1 ? "h-4 w-2/3" : "h-4 w-full"} />
      ))}
    </div>
  );
}
