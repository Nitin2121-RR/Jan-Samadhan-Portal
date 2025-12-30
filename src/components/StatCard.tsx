import React from "react";
import { cn } from "./ui/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  variant?: "default" | "primary" | "success" | "warning" | "destructive" | "accent";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const variantStyles = {
  default: {
    bg: "bg-card",
    iconBg: "bg-secondary",
    iconColor: "text-foreground",
    border: "border-border",
  },
  primary: {
    bg: "bg-primary/5",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    border: "border-primary/20",
  },
  success: {
    bg: "bg-success/5",
    iconBg: "bg-success/10",
    iconColor: "text-success",
    border: "border-success/20",
  },
  warning: {
    bg: "bg-warning/5",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    border: "border-warning/20",
  },
  destructive: {
    bg: "bg-destructive/5",
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    border: "border-destructive/20",
  },
  accent: {
    bg: "bg-accent/5",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    border: "border-accent/20",
  },
};

const sizeStyles = {
  sm: {
    padding: "p-4",
    iconSize: "w-8 h-8",
    iconInner: "w-4 h-4",
    valueSize: "text-xl",
    labelSize: "text-xs",
  },
  md: {
    padding: "p-5",
    iconSize: "w-10 h-10",
    iconInner: "w-5 h-5",
    valueSize: "text-2xl",
    labelSize: "text-sm",
  },
  lg: {
    padding: "p-6",
    iconSize: "w-12 h-12",
    iconInner: "w-6 h-6",
    valueSize: "text-3xl",
    labelSize: "text-sm",
  },
};

export function StatCard({
  label,
  value,
  icon,
  trend,
  variant = "default",
  size = "md",
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-3 h-3" />;
    if (trend.value < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value > 0) return "text-success";
    if (trend.value < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-200 hover:shadow-md",
        styles.bg,
        styles.border,
        sizes.padding,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={cn("text-muted-foreground font-medium truncate", sizes.labelSize)}>
            {label}
          </p>
          <p className={cn("font-bold text-foreground font-display tracking-tight mt-1", sizes.valueSize)}>
            {value}
          </p>

          {trend && (
            <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && (
                <span className="text-muted-foreground ml-1">{trend.label}</span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div
            className={cn(
              "flex-shrink-0 rounded-lg flex items-center justify-center",
              styles.iconBg,
              styles.iconColor,
              sizes.iconSize
            )}
          >
            <div className={sizes.iconInner}>{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatGrid({ children, columns = 4, className }: StatGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}

export default StatCard;
