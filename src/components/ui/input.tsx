import * as React from "react";

import { cn } from "./utils";

export interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean;
}

function Input({ className, type, error, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "flex h-11 w-full min-w-0 rounded-lg border bg-input-background px-4 py-2.5 text-base text-foreground transition-all duration-200",
        // Placeholder
        "placeholder:text-muted-foreground/70",
        // File input
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // Selection
        "selection:bg-primary selection:text-primary-foreground",
        // Focus state
        "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary focus:bg-background",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Error state
        error && "border-destructive focus:ring-destructive/40 focus:border-destructive",
        // Default border
        !error && "border-border hover:border-muted-foreground/40",
        // Responsive
        "md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
