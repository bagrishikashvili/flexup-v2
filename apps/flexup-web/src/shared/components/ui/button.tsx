import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-120 outline-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "cursor-pointer btn-primary rounded-md text-white shadow-[0_1px_2px_rgba(102,71,240,0.2)] active:translate-y-0 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:filter-none",
        destructive:
          "cursor-pointer bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90",
        outline:
          "cursor-pointer rounded-md border border-input bg-background text-foreground hover:bg-muted hover:border-[#D1D5DB]",
        secondary:
          "cursor-pointer rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "cursor-pointer rounded-md text-foreground hover:bg-accent hover:text-accent-foreground",
        logo: 
          "cursor-pointer bg-accent rounded-md text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "cursor-pointer text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-[18px] py-[10px]",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
