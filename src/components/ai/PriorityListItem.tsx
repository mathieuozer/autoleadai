import { HTMLAttributes, forwardRef } from 'react';
import { PriorityItem } from '@/types';
import { RiskBadge } from './RiskBadge';
import { Button } from '@/components/ui';

interface PriorityListItemProps extends HTMLAttributes<HTMLDivElement> {
  item: PriorityItem;
  onViewDetails?: () => void;
  onTakeAction?: () => void;
}

export const PriorityListItem = forwardRef<HTMLDivElement, PriorityListItemProps>(
  ({ item, onViewDetails, onTakeAction, className = '', ...props }, ref) => {
    const { order, rank, riskLevel, riskScore, nextBestAction } = item;

    const borderColors = {
      HIGH: 'border-l-red-500',
      MEDIUM: 'border-l-orange-500',
      LOW: 'border-l-green-500',
    };

    const bgColors = {
      HIGH: 'bg-red-50',
      MEDIUM: 'bg-orange-50',
      LOW: 'bg-green-50',
    };

    return (
      <div
        ref={ref}
        className={`rounded-lg border-l-4 p-4 ${borderColors[riskLevel]} ${bgColors[riskLevel]} ${className}`}
        {...props}
      >
        {/* Header Row */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-700 shadow-sm">
              {rank}
            </span>
            <div>
              <h4 className="font-semibold text-gray-900">{order.customer.name}</h4>
              <p className="text-sm text-gray-600">
                {order.vehicle.make} {order.vehicle.model} {order.vehicle.year}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{riskScore}</p>
              <p className="text-xs text-gray-500">Risk Score</p>
            </div>
            <RiskBadge level={riskLevel} />
          </div>
        </div>

        {/* Action Recommendation */}
        <div className="mb-3 rounded bg-white/50 p-2">
          <p className="text-sm">
            <span className="font-medium text-gray-700">Recommended:</span>{' '}
            <span className="text-gray-600">{nextBestAction.action}</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">{nextBestAction.expectedImpact}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={onTakeAction}>
            Take Action
          </Button>
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            View Details
          </Button>
        </div>
      </div>
    );
  }
);

PriorityListItem.displayName = 'PriorityListItem';
