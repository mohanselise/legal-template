import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const kbdVariants = cva(
  "inline-flex items-center justify-center rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-1.5 py-0.5 font-mono text-xs font-semibold text-[hsl(var(--fg))] shadow-sm",
  {
    variants: {
      variant: {
        default: "border-[hsl(var(--border))] bg-[hsl(var(--muted))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface KbdProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof kbdVariants> {}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={cn(kbdVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
Kbd.displayName = "Kbd"

export interface KbdGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const KbdGroup = React.forwardRef<HTMLDivElement, KbdGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center gap-1", className)}
        {...props}
      />
    )
  }
)
KbdGroup.displayName = "KbdGroup"

export { Kbd, KbdGroup, kbdVariants }

