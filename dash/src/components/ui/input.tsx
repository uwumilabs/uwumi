import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-full bg-transparent px-4 py-1 text-base shadow-[inset_0_0_0_1.5px_var(--color-rule-2)] transition-shadow duration-micro ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus focus-visible:shadow-[inset_0_0_0_1.5px_var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
