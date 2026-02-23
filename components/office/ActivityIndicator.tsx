"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Animated activity indicators for team member status
 * Optimized with CSS transforms and reduced motion support
 */

/**
 * Typing indicator with three bouncing dots
 * Used when a team member is actively working
 */
interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1 h-1 rounded-full bg-current"
          animate={{
            y: [0, -3, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Idle indicator with subtle pulsing dot
 * Used when team member is online but not actively working
 */
interface IdleIndicatorProps {
  className?: string;
}

export function IdleIndicator({ className }: IdleIndicatorProps) {
  return (
    <div className={cn("relative flex items-center justify-center w-2 h-2", className)}>
      <motion.div
        className="absolute inset-0 rounded-full bg-current opacity-30"
        animate={{
          scale: [1, 1.5],
          opacity: [0.3, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
      <motion.div
        className="w-1.5 h-1.5 rounded-full bg-current"
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

/**
 * Loading indicator with spinning ring
 */
interface LoadingIndicatorProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingIndicator({ className, size = "md" }: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  };

  return (
    <motion.div
      className={cn(
        "rounded-full border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

/**
 * Activity indicator that switches between typing and idle states
 */
interface ActivityIndicatorProps {
  type: "typing" | "idle" | "loading";
  className?: string;
}

export default function ActivityIndicator({
  type,
  className,
}: ActivityIndicatorProps) {
  switch (type) {
    case "typing":
      return <TypingIndicator className={className} />;
    case "idle":
      return <IdleIndicator className={className} />;
    case "loading":
      return <LoadingIndicator className={className} />;
    default:
      return null;
  }
}
