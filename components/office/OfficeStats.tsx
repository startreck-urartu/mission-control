"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { Users, Zap, Monitor } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import type { AccentName } from "@/lib/status-colors";

/**
 * Office statistics display with animated counters
 * Uses spring animation for smooth number transitions
 */

interface OfficeStatsProps {
  total: number;
  online: number;
  active: number;
  className?: string;
}

/**
 * Animated counter that smoothly transitions between values
 */
function AnimatedCounter({ value }: { value: number }) {
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
  });

  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

interface StatRowProps {
  label: string;
  value: number;
  accent: AccentName;
  Icon: LucideIcon;
  index: number;
}

function AnimatedStatCard({ label, value, accent, Icon, index }: StatRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
    >
      <StatCard
        label={label}
        value={<AnimatedCounter value={value} />}
        icon={Icon}
        accent={accent}
      />
    </motion.div>
  );
}

export default function OfficeStats({ total, online, active, className }: OfficeStatsProps) {
  const stats: Array<{ label: string; value: number; accent: AccentName; Icon: LucideIcon }> = [
    { label: "Team Members", value: total, accent: "blue",  Icon: Users },
    { label: "Online Now",   value: online, accent: "green", Icon: Zap },
    { label: "Working",      value: active, accent: "teal",  Icon: Monitor },
  ];

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-4", className)}>
      {stats.map((stat, index) => (
        <AnimatedStatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          accent={stat.accent}
          Icon={stat.Icon}
          index={index}
        />
      ))}
    </div>
  );
}
