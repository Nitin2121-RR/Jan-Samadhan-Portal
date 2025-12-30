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
        "flex h-11 w-full min-w-0 rounded-lg px-4 py-2.5 text-base text-foreground transition-all duration-200",
        // Placeholder
        "placeholder:text-muted-foreground/70",
        // File input
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // Selection
        "selection:bg-primary selection:text-primary-foreground",
        // Focus state
        "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Responsive
        "md:text-sm",
        className,
      )}
      style={{
        backgroundColor: '#f5f5f7',
        border: error ? '1px solid #d4183d' : '1px solid #d1d5db',
      }}
      {...props}
    />
  );
}

export { Input };
