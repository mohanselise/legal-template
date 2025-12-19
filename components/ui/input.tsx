import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "h-11 w-full min-w-0 rounded-lg border px-4 py-2.5",
        "bg-background text-foreground",
        "text-base font-normal leading-tight",
        "shadow-sm transition-[color,box-shadow,border-color,background-color]",
        
        // Text selection - improved contrast and visibility
        "selection:bg-[hsl(var(--selise-blue))] selection:text-white",
        "selection:bg-opacity-80",
        
        // File input styles
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        
        // Placeholder
        "placeholder:text-muted-foreground placeholder:opacity-60",
        
        // Focus states - clear and visible
        "outline-none",
        "focus-visible:border-[hsl(var(--selise-blue))]",
        "focus-visible:ring-2 focus-visible:ring-[hsl(var(--selise-blue))] focus-visible:ring-opacity-20",
        "focus-visible:bg-background",
        
        // Invalid states
        "aria-invalid:border-destructive",
        "aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        
        // Disabled states
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "disabled:bg-muted/50",
        
        // Ensure text is selectable and cursor is visible
        "cursor-text select-text",
        "hover:border-[hsl(var(--border))]",
        
        className
      )}
      {...props}
    />
  )
}

export { Input }
