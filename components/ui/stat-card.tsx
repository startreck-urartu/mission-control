import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { accentPill, type AccentName } from "@/lib/status-colors";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  accent?: AccentName;
  iconClassName?: string;
  sub?: React.ReactNode;
  className?: string;
}

/** Apple-style stat tile: tinted icon chip left, numeral right. */
export function StatCard({
  label, value, icon: Icon, accent = "gray", iconClassName, sub, className,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {Icon && (
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", accentPill[accent], iconClassName)}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div className="text-right">
            <div className="text-2xl font-bold tracking-tight tabular-nums text-foreground">{value}</div>
            <div className="text-xs font-medium text-muted">{label}</div>
            {sub && <div className="text-xs text-tertiary mt-0.5">{sub}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
