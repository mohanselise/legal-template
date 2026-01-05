"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Tailwind-styled textarea component (shadcn-style).
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base styles
          "flex min-h-[80px] w-full rounded-lg border px-4 py-3",
          "bg-[hsl(var(--bg))] text-[hsl(var(--fg))]",
          "border-[hsl(var(--border))]",
          "text-base font-normal leading-relaxed",
          "shadow-sm transition-[color,box-shadow,border-color,background-color]",
          
          // Text selection - improved contrast and visibility
          "selection:bg-[hsl(var(--selise-blue))] selection:text-white",
          "selection:bg-opacity-80",
          
          // Placeholder - better contrast
          "placeholder:text-[hsl(var(--globe-grey))] placeholder:opacity-70",
          
          // Focus states - clear and visible
          "outline-none",
          "focus-visible:border-[hsl(var(--selise-blue))]",
          "focus-visible:ring-2 focus-visible:ring-[hsl(var(--selise-blue))] focus-visible:ring-opacity-20",
          "focus-visible:bg-[hsl(var(--bg))]",
          
          // Invalid states
          "aria-invalid:border-[hsl(var(--destructive))]",
          "aria-invalid:ring-2 aria-invalid:ring-[hsl(var(--destructive))]/20",
          
          // Disabled states
          "disabled:cursor-not-allowed disabled:opacity-50",
          "disabled:bg-[hsl(var(--muted))]/50",
          
          // Ensure text is selectable and cursor is visible
          "cursor-text select-text",
          "hover:border-[hsl(var(--selise-blue))]/30",
          "resize-y",
          
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
