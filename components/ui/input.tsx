import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground selection:bg-primary selection:text-primary-foreground",
        "h-11 w-full min-w-0 rounded-lg border-2 px-4 py-2.5",
        "text-base font-normal leading-tight",
        "shadow-sm transition-[color,box-shadow,border-color]",
        "outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-muted-foreground/60",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-blue-500 dark:focus-visible:border-blue-400",
        "focus-visible:ring-blue-500/30 dark:focus-visible:ring-blue-400/30 focus-visible:ring-4",
        "aria-invalid:ring-destructive/30 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
