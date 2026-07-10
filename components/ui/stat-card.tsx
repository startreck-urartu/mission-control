import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  sub?: React.ReactNode;
  className?: string;
}

/**
 * Shared stat tile: icon left, right-aligned value over label.
 * Matches the glass stat-grid idiom used across pages.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  sub,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("glass", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {Icon && (
            <Icon className={cn("w-8 h-8 text-gray-500", iconClassName)} />
          )}
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
            {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
