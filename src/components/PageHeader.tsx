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
    <div className={cn(className)} style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', minWidth: 0 }}>
          {onBack && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onBack}
              style={{ flexShrink: 0, marginLeft: '-8px', marginTop: '2px' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}

          {icon && (
            <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(3, 2, 19, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#030213' }}>
              {icon}
            </div>
          )}

          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.025em' }}>
              {title}
            </h1>
            {description && (
              <p style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>
                {description}
              </p>
            )}
          </div>
        </div>

        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>

      {children && <div style={{ marginTop: '16px' }}>{children}</div>}
    </div>
  );
}

export default PageHeader;
