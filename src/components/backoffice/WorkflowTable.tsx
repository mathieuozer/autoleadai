'use client';

import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

export interface WorkflowItem {
  id: string;
  orderNumber: string;
  customerName: string;
  vehicleInfo: string;
  stage: string;
  assignee: {
    name: string;
    avatar?: string;
  };
  slaStatus: 'on-track' | 'at-risk' | 'overdue';
  slaTime?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface WorkflowTableProps {
  items: WorkflowItem[];
  onRowClick?: (id: string) => void;
  className?: string;
}

const slaStatusLabels: Record<WorkflowItem['slaStatus'], string> = {
  'on-track': 'On Track',
  'at-risk': 'At Risk',
  overdue: 'Overdue',
};

export function WorkflowTable({ items, onRowClick, className = '' }: WorkflowTableProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 bg-gray-50/50">
                Order
              </th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 bg-gray-50/50">
                Customer
              </th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 bg-gray-50/50">
                Vehicle
              </th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 bg-gray-50/50">
                Stage
              </th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 bg-gray-50/50">
                Assignee
              </th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 bg-gray-50/50">
                SLA Status
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item.id)}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{item.orderNumber}</span>
                    {item.priority === 'high' && (
                      <span className="w-2 h-2 rounded-full bg-red-500" title="High Priority" />
                    )}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="text-gray-900">{item.customerName}</span>
                </td>
                <td className="py-4 px-6">
                  <span className="text-gray-600">{item.vehicleInfo}</span>
                </td>
                <td className="py-4 px-6">
                  <Badge variant="accent" size="sm">
                    {item.stage}
                  </Badge>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={item.assignee.name}
                      src={item.assignee.avatar}
                      size="sm"
                    />
                    <span className="text-gray-600 text-sm">{item.assignee.name}</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <Badge variant={item.slaStatus as BadgeVariant} size="sm">
                      {slaStatusLabels[item.slaStatus]}
                    </Badge>
                    {item.slaTime && (
                      <span className="text-xs text-gray-500">{item.slaTime}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
