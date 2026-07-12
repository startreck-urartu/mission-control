import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { accentPill, type AccentName } from "@/lib/status-colors"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "", secondary: "", destructive: "", outline: "",
        success: "", warning: "",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

const legacyVariantColor: Record<string, AccentName> = {
  default: "blue", secondary: "gray", destructive: "red",
  outline: "gray", success: "green", warning: "yellow",
}

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof badgeVariants> {
  color?: AccentName
}

function Badge({ className, variant, color, ...props }: BadgeProps) {
  const accent = color ?? legacyVariantColor[variant ?? "default"]
  return (
    <div
      className={cn(badgeVariants({ variant }), accentPill[accent], className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
