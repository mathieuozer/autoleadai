'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import { Card, CardTitle, Button, Badge } from '@/components/ui';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Globe,
  User,
  Car,
  Hash,
  Mail,
  Phone,
} from 'lucide-react';

interface Order {
  id: string;
  vinNumber: string | null;
  portalActivated: boolean;
  portalActivatedAt: string | null;
  status: string;
  customer: {
    name: string;
    email: string | null;
    phone: string;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    variant: string | null;
  };
}

interface ActivatePortalPageProps {
  params: Promise<{ id: string }>;
}

export default function ActivatePortalPage({ params }: ActivatePortalPageProps) {
  const { id: orderId } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const fetchOrder = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const result = await res.json();

      if (result.success) {
        setOrder(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch order');
      }
    } catch (err) {
      setError('Failed to fetch order');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleActivate = async () => {
    setIsActivating(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/activate-portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activatedBy: 'current-user-id', // Would come from auth context
        }),
      });

      const result = await res.json();

      if (result.success) {
        router.push(`/orders/${orderId}`);
      } else {
        alert(result.error?.message || 'Failed to activate portal');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to activate portal');
    } finally {
      setIsActivating(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Customer Portal" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      </PageContainer>
    );
  }

  if (error || !order) {
    return (
      <PageContainer title="Customer Portal" subtitle="Error loading data">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
          <Link href={`/orders/${orderId}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Order
            </Button>
          </Link>
        </Card>
      </PageContainer>
    );
  }

  if (!order.vinNumber) {
    return (
      <PageContainer
        title="Customer Portal"
        subtitle="VIN required before activation"
      >
        <div className="mb-6">
          <Link href={`/orders/${orderId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Order
            </Button>
          </Link>
        </div>

        <Card className="text-center py-12">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <p className="text-lg font-medium mb-2">VIN Required</p>
          <p className="text-gray-500 mb-6">
            Please assign a VIN to this order before activating the customer portal.
          </p>
          <Link href={`/orders/${orderId}/vin`}>
            <Button>
              <Hash className="mr-2 h-4 w-4" />
              Assign VIN
            </Button>
          </Link>
        </Card>
      </PageContainer>
    );
  }

  if (order.portalActivated) {
    return (
      <PageContainer
        title="Customer Portal"
        subtitle="Portal is already activated"
      >
        <div className="mb-6">
          <Link href={`/orders/${orderId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Order
            </Button>
          </Link>
        </div>

        <Card className="text-center py-12">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <p className="text-lg font-medium mb-2">Portal Activated</p>
          <p className="text-gray-500 mb-2">
            The customer portal was activated on
          </p>
          <p className="font-medium">
            {order.portalActivatedAt
              ? new Date(order.portalActivatedAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Unknown date'}
          </p>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg inline-block">
            <p className="text-sm text-gray-500">Customer can access their portal at:</p>
            <p className="font-mono text-violet-600 mt-1">
              portal.autolead.ai/track/{orderId.slice(0, 8)}
            </p>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Activate Customer Portal"
      subtitle="Give customers access to track their order"
    >
      <div className="mb-6">
        <Link href={`/orders/${orderId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Order
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activation Card */}
        <Card>
          <CardTitle className="mb-4">Portal Activation</CardTitle>
          <div className="space-y-6">
            <div className="p-4 bg-violet-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Globe className="h-6 w-6 text-violet-600 mt-0.5" />
                <div>
                  <p className="font-medium text-violet-900">What is the Customer Portal?</p>
                  <p className="text-sm text-violet-700 mt-1">
                    The customer portal allows your customer to track their order status,
                    view delivery updates, and access important documents online.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Real-time order status tracking</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Delivery milestone notifications</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Document downloads (quotations, invoices)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Direct communication channel</span>
              </div>
            </div>

            <Button
              onClick={handleActivate}
              disabled={isActivating}
              className="w-full"
              size="lg"
            >
              {isActivating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-5 w-5" />
                  Activate Customer Portal
                </>
              )}
            </Button>

            {order.customer.email && (
              <p className="text-sm text-gray-500 text-center">
                An access link will be sent to {order.customer.email}
              </p>
            )}
          </div>
        </Card>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardTitle className="mb-4">Customer</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                <User className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="font-medium">{order.customer.name}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {order.customer.phone}
                  </span>
                  {order.customer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {order.customer.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-4">Vehicle</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Car className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="font-medium">
                  {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
                </p>
                {order.vehicle.variant && (
                  <p className="text-sm text-gray-500">{order.vehicle.variant}</p>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">VIN</span>
                <span className="font-mono text-sm">{order.vinNumber}</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-4">Order Status</CardTitle>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Current Status</span>
              <Badge variant="primary">
                {order.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
