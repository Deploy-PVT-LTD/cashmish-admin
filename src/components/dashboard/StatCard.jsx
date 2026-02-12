import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10'
}) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground font-medium">{title}</span>
          <span className="text-2xl font-semibold text-foreground">{value}</span>
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconBgColor)}>
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
      </div>
      
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-4">
          {isPositive && <TrendingUp className="w-4 h-4 text-success" />}
          {isNegative && <TrendingDown className="w-4 h-4 text-destructive" />}
          <span className={cn(
            'text-sm font-medium',
            isPositive && 'text-success',
            isNegative && 'text-destructive',
            !isPositive && !isNegative && 'text-muted-foreground'
          )}>
            {isPositive && '+'}{change}%
          </span>
          <span className="text-sm text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}
