import * as React from "react";
import { cn } from "./utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "text" | "title" | "button";
}

function Skeleton({
  className,
  variant = "default",
  ...props
}: SkeletonProps) {
  const variantClasses = {
    default: "rounded-md",
    circular: "rounded-full",
    text: "h-4 rounded",
    title: "h-6 rounded w-3/4",
    button: "h-10 rounded-lg w-24",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
}

function SkeletonCard({
  className,
  lines = 3,
  showAvatar = false,
  showImage = false,
  ...props
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-6 space-y-4",
        className
      )}
      {...props}
    >
      {showImage && (
        <Skeleton className="h-40 w-full rounded-lg" />
      )}

      {showAvatar && (
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{ width: i === lines - 1 ? "60%" : "100%" }}
          />
        ))}
      </div>
    </div>
  );
}

interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  showAvatar?: boolean;
}

function SkeletonList({
  className,
  count = 5,
  showAvatar = true,
  ...props
}: SkeletonListProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl"
        >
          {showAvatar && (
            <Skeleton variant="circular" className="h-12 w-12 flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

interface SkeletonGridProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  columns?: 2 | 3 | 4;
}

function SkeletonGrid({
  className,
  count = 6,
  columns = 3,
  ...props
}: SkeletonGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-6", gridCols[columns], className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} showImage lines={2} />
      ))}
    </div>
  );
}

interface SkeletonStatsProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
}

function SkeletonStats({
  className,
  count = 4,
  ...props
}: SkeletonStatsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-4 gap-4",
        className
      )}
      {...props}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-xl p-4 space-y-2"
        >
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  );
}

interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
}

function SkeletonTable({
  className,
  rows = 5,
  columns = 4,
  ...props
}: SkeletonTableProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4 flex-1"
            style={{ maxWidth: i === 0 ? "30%" : "20%" }}
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-4 p-4 border-b border-border last:border-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className="h-4 flex-1"
              style={{ maxWidth: colIndex === 0 ? "30%" : "20%" }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonGrid,
  SkeletonStats,
  SkeletonTable,
};
