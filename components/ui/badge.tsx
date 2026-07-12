import * as React from "react"
import { cn } from "@/lib/utils"
import { accentPill, type AccentName } from "@/lib/status-colors"

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  color?: AccentName
}

/** Tinted pill chip. Color comes from the Apple accent palette via accentPill. */
function Badge({ className, color = "gray", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
        accentPill[color],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
