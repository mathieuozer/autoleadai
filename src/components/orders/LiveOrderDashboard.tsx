'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
  };
  status: string;
  riskLevel: string;
  riskScore: number;
  totalAmount: number;
  createdAt: string;
  salesperson?: {
    name: string;
    avatar?: string;
  };
  portalActivated: boolean;
  vinNumber?: string;
}

interface LiveOrderDashboardProps {
  orders: Order[];
  onViewOrder: (orderId: string) => void;
  isLoading?: boolean;
}

export function LiveOrderDashboard({
  orders,
  onViewOrder,
  isLoading,
}: LiveOrderDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'success' | 'warning' | 'info' | 'default' | 'danger'; label: string }> = {
      NEW: { variant: 'info', label: 'New' },
      CONTACTED: { variant: 'info', label: 'Contacted' },
      TEST_DRIVE_SCHEDULED: { variant: 'warning', label: 'Test Drive Scheduled' },
      TEST_DRIVE_DONE: { variant: 'info', label: 'Test Drive Done' },
      NEGOTIATION: { variant: 'warning', label: 'Negotiation' },
      BOOKING_DONE: { variant: 'success', label: 'Booked' },
      FINANCING_PENDING: { variant: 'warning', label: 'Financing Pending' },
      FINANCING_APPROVED: { variant: 'success', label: 'Financing Approved' },
      READY_FOR_DELIVERY: { variant: 'success', label: 'Ready for Delivery' },
      DELIVERED: { variant: 'success', label: 'Delivered' },
      CANCELLED: { variant: 'danger', label: 'Cancelled' },
    };

    const config = statusMap[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRiskBadge = (level: string) => {
    const riskMap: Record<string, 'success' | 'warning' | 'danger'> = {
      LOW: 'success',
      MEDIUM: 'warning',
      HIGH: 'danger',
    };
    return <Badge variant={riskMap[level] || 'default'}>{level}</Badge>;
  };

  // Group orders by status for kanban-like view
  const statusGroups = [
    { key: 'NEW', label: 'New Orders', orders: orders.filter(o => o.status === 'NEW') },
    { key: 'IN_PROGRESS', label: 'In Progress', orders: orders.filter(o => ['CONTACTED', 'TEST_DRIVE_SCHEDULED', 'TEST_DRIVE_DONE', 'NEGOTIATION'].includes(o.status)) },
    { key: 'BOOKED', label: 'Booked', orders: orders.filter(o => ['BOOKING_DONE', 'FINANCING_PENDING', 'FINANCING_APPROVED'].includes(o.status)) },
    { key: 'DELIVERY', label: 'Ready/Delivered', orders: orders.filter(o => ['READY_FOR_DELIVERY', 'DELIVERED'].includes(o.status)) },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Total Active</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">High Risk</p>
            <p className="text-2xl font-bold text-red-600">
              {orders.filter(o => o.riskLevel === 'HIGH').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">VIN Assigned</p>
            <p className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.vinNumber).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Total Value</p>
            <p className="text-2xl font-bold">
              {formatCurrency(orders.reduce((sum, o) => sum + o.totalAmount, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban-like Order Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusGroups.map((group) => (
          <div key={group.key} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">{group.label}</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {group.orders.length}
              </span>
            </div>
            <div className="space-y-3 min-h-[200px]">
              {group.orders.map((order) => (
                <Card
                  key={order.id}
                  padding="sm"
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onViewOrder(order.id)}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{order.customer.name}</p>
                        <p className="text-sm text-gray-500">{order.customer.phone}</p>
                      </div>
                      {getRiskBadge(order.riskLevel)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
                      </p>
                      <p className="text-sm font-semibold text-violet-600">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      {getStatusBadge(order.status)}
                      <div className="flex items-center gap-2">
                        {order.vinNumber && (
                          <span className="text-xs text-green-600" title="VIN Assigned">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                        {order.portalActivated && (
                          <span className="text-xs text-blue-600" title="Portal Active">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {group.orders.length === 0 && (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm border-2 border-dashed rounded-lg">
                  No orders
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
