import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onBack?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  icon,
  action,
  onBack,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 sm:mb-8", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          {onBack && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onBack}
              className="flex-shrink-0 -ml-2 mt-0.5"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}

          {icon && (
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display tracking-tight truncate">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm sm:text-base text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>

        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {children && <div className="mt-4 sm:mt-6">{children}</div>}
    </div>
  );
}

export default PageHeader;
