import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const cardVariants = cva(
  "flex flex-col text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "rounded-xl shadow-sm",
        elevated: "rounded-xl shadow-md hover:shadow-lg",
        glass: "backdrop-blur-xl rounded-xl shadow-lg",
        ghost: "bg-transparent",
        outline: "bg-transparent rounded-xl",
        interactive: "rounded-xl shadow-sm hover:shadow-md cursor-pointer active:scale-[0.99]",
        stat: "rounded-xl shadow-sm overflow-hidden",
        feature: "rounded-xl shadow-md",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Card({
  className,
  variant,
  style,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  const baseStyle = variant === 'ghost' || variant === 'outline'
    ? {}
    : { backgroundColor: '#ffffff', border: '1px solid #e5e7eb' };

  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, className }))}
      style={{ ...baseStyle, ...style }}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-2 p-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-lg font-semibold leading-tight tracking-tight font-display", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "absolute top-0 right-4 mt-4",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-6 pt-0", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-4 p-6 pt-0", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
};
