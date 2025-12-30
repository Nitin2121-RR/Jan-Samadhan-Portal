import React from 'react';
import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ReputationBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  trend?: 'up' | 'down' | 'stable';
}

export const ReputationBadge: React.FC<ReputationBadgeProps> = ({
  score,
  size = 'md',
  showLabel = true,
  trend,
}) => {
  // Determine tier based on score (0-1000)
  const getTier = (s: number): { name: string; color: string; bgColor: string } => {
    if (s >= 900) return { name: 'Exceptional', color: 'text-saffron', bgColor: 'bg-saffron/15' };
    if (s >= 750) return { name: 'Excellent', color: 'text-success', bgColor: 'bg-success/10' };
    if (s >= 600) return { name: 'Good', color: 'text-primary', bgColor: 'bg-primary/10' };
    if (s >= 400) return { name: 'Average', color: 'text-muted-foreground', bgColor: 'bg-secondary/70' };
    return { name: 'Needs Improvement', color: 'text-warning', bgColor: 'bg-warning/10' };
  };

  const tier = getTier(score);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full ${tier.bgColor} ${tier.color} ${sizeClasses[size]} font-medium`}>
      <Star className={`${iconSizes[size]} fill-current`} />
      <span>{score}</span>
      {showLabel && <span className="opacity-75">/ 1000</span>}
      {trend && (
        <>
          {trend === 'up' && <TrendingUp className={iconSizes[size]} />}
          {trend === 'down' && <TrendingDown className={iconSizes[size]} />}
          {trend === 'stable' && <Minus className={iconSizes[size]} />}
        </>
      )}
    </div>
  );
};

interface ReputationCardProps {
  score: number;
  metrics: {
    resolutionRate: number;
    avgResponseTimeHours: number;
    grievancesResolved: number;
    grievancesAssigned: number;
  };
  authorityName?: string;
}

export const ReputationCard: React.FC<ReputationCardProps> = ({
  score,
  metrics,
  authorityName,
}) => {
  const getTier = (s: number) => {
    if (s >= 900) return { name: 'Exceptional', color: 'text-foreground', header: 'bg-saffron', bar: 'bg-saffron' };
    if (s >= 750) return { name: 'Excellent', color: 'text-foreground', header: 'bg-success', bar: 'bg-success' };
    if (s >= 600) return { name: 'Good', color: 'text-foreground', header: 'bg-primary', bar: 'bg-primary' };
    if (s >= 400) return { name: 'Average', color: 'text-foreground', header: 'bg-secondary', bar: 'bg-secondary' };
    return { name: 'Needs Improvement', color: 'text-foreground', header: 'bg-warning', bar: 'bg-warning' };
  };

  const tier = getTier(score);

  const formatResponseTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${Math.round(hours)} hrs`;
    return `${Math.round(hours / 24)} days`;
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      {/* Header with gradient */}
      <div className={`${tier.header} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            {authorityName && (
              <p className="text-sm opacity-90 mb-1">{authorityName}</p>
            )}
            <p className="text-2xl font-bold">{score}</p>
            <p className="text-sm opacity-90">{tier.name}</p>
          </div>
          <div className="text-5xl opacity-30">
            <Star className="w-16 h-16 fill-current" />
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Resolution Rate</p>
          <p className="text-lg font-semibold text-foreground">
            {metrics.resolutionRate}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Avg Response</p>
          <p className="text-lg font-semibold text-foreground">
            {formatResponseTime(metrics.avgResponseTimeHours)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Resolved</p>
          <p className="text-lg font-semibold text-foreground">
            {metrics.grievancesResolved}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Assigned</p>
          <p className="text-lg font-semibold text-foreground">
            {metrics.grievancesAssigned}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-4">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full ${tier.bar} transition-all duration-500`}
            style={{ width: `${(score / 1000) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ReputationBadge;
