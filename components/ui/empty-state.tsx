import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  message: string;
  hint?: string;
  children?: React.ReactNode; // optional action button
}

/** Standard empty state for lists/boards with no data. */
export function EmptyState({ icon: Icon, message, hint, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon className="w-8 h-8 text-tertiary mb-3" />}
      <p className="text-[13px] font-medium text-muted">{message}</p>
      {hint && <p className="text-xs text-tertiary mt-1">{hint}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
