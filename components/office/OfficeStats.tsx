"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { Users, Zap, Monitor, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

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

/**
 * Individual stat card with icon, label, and animated counter
 */
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  trend?: number;
  index: number;
}

function StatCard({ label, value, icon, colorClass, trend, index }: StatCardProps) {
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
        transition: { duration: 0.2 }
      }}
    >
      <Card className="glass card-hover highlight-top overflow-hidden group">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-1">{label}</p>
              <div className="flex items-baseline gap-2">
                <span className={cn("text-3xl font-bold", colorClass)}>
                  <AnimatedCounter value={value} />
                </span>
                {trend !== undefined && trend !== 0 && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "text-xs font-medium flex items-center gap-0.5",
                      trend > 0 ? "text-green-400" : "text-red-400"
                    )}
                  >
                    {trend > 0 ? "+" : ""}
                    {trend}%
                  </motion.span>
                )}
              </div>
            </div>
            
            <motion.div
              className={cn(
                "p-3 rounded-xl transition-colors duration-300",
                "bg-white/[0.06] group-hover:bg-white/[0.1]"
              )}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {icon}
            </motion.div>
          </div>
          
          {/* Subtle progress bar indicator */}
          <div className="mt-4 h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", colorClass.replace("text-", "bg-"))}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((value / (label === "Team Members" ? Math.max(value, 10) : Math.max(value, 20))) * 100, 100)}%` }}
              transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function OfficeStats({ total, online, active, className }: OfficeStatsProps) {
  const stats = [
    {
      label: "Team Members",
      value: total,
      icon: <Users className="w-6 h-6 text-blue-400" />,
      colorClass: "text-white",
    },
    {
      label: "Online Now",
      value: online,
      icon: <Zap className="w-6 h-6 text-green-400" />,
      colorClass: "text-green-400",
    },
    {
      label: "Working",
      value: active,
      icon: <Monitor className="w-6 h-6 text-blue-400" />,
      colorClass: "text-blue-400",
    },
  ];

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-4", className)}>
      {stats.map((stat, index) => (
        <StatCard
          key={stat.label}
          {...stat}
          index={index}
        />
      ))}
    </div>
  );
}
