'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import { RiskBadge } from '@/components/ai';
import { ArrowLeft, Loader2, AlertCircle, ChevronRight, Car, User } from 'lucide-react';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  riskScore: number;
  riskLevel: string;
  customer: { name: string };
  vehicle: { make: string; model: string; year: number };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch('/api/orders?pageSize=50');
        const result = await response.json();
        if (result.success) {
          setOrders(result.data);
        } else {
          setError(result.error?.message || 'Failed to fetch orders');
        }
      } catch {
        setError('Failed to fetch orders');
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (isLoading) {
    return (
      <PageContainer title="Orders" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Orders" subtitle="Error loading orders">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-red-600">{error}</p>
          <Link href="/dashboard" className="mt-4 inline-block">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="All Orders"
      subtitle={`${orders.length} active orders`}
    >
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Card padding="none">
        <div className="divide-y divide-gray-100">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No orders found
            </div>
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between p-4 hover:bg-[#f5f3ff] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <RiskBadge level={order.riskLevel as 'HIGH' | 'MEDIUM' | 'LOW'} size="sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{order.customer.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Car className="h-3 w-3" />
                      {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'default'}>
                    {order.status.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-sm font-medium">
                    AED {order.totalAmount.toLocaleString()}
                  </span>
                  <ChevronRight className="h-5 w-5 text-[#7c3aed]" />
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>
    </PageContainer>
  );
}
