import * as React from "react"

import { cn } from "@/shared/utils/cn"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full mb-1 rounded-md border border-input bg-background px-3 py-[10px] text-sm text-foreground placeholder:text-muted-foreground/60 transition-shadow",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_2px_rgba(102,71,240,0.15)]",
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:border-destructive aria-[invalid=true]:focus-visible:shadow-[0_0_0_2px_rgba(229,0,0,0.15)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
