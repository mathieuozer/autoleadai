import { HTMLAttributes, forwardRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { RiskLevel } from '@/types';

interface PriorityScoreProps extends HTMLAttributes<HTMLDivElement> {
  score: number;
  previousScore?: number;
  level: RiskLevel;
  lastUpdated?: string;
}

const levelColors: Record<RiskLevel, string> = {
  HIGH: 'text-red-600',
  MEDIUM: 'text-orange-600',
  LOW: 'text-green-600',
};

export const PriorityScore = forwardRef<HTMLDivElement, PriorityScoreProps>(
  ({ score, previousScore, level, lastUpdated, className = '', ...props }, ref) => {
    const trend = previousScore !== undefined ? score - previousScore : 0;
    const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
    const trendColor = trend > 0 ? 'text-red-500' : trend < 0 ? 'text-green-500' : 'text-gray-400';

    return (
      <div ref={ref} className={`flex flex-col items-center ${className}`} {...props}>
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${levelColors[level]}`}>{score}</span>
          {previousScore !== undefined && (
            <div className={`flex items-center gap-0.5 ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{Math.abs(trend)}</span>
            </div>
          )}
        </div>
        <span className="mt-1 text-xs text-gray-500">Risk Score</span>
        {lastUpdated && (
          <span className="mt-0.5 text-xs text-gray-400">Updated {lastUpdated}</span>
        )}
      </div>
    );
  }
);

PriorityScore.displayName = 'PriorityScore';
