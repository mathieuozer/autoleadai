'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import { Card, CardTitle, Button, Input, Badge } from '@/components/ui';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Hash,
  Car,
  Search,
} from 'lucide-react';

interface Order {
  id: string;
  vinNumber: string | null;
  status: string;
  customer: {
    name: string;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    variant: string | null;
    color: string | null;
  };
}

interface InventoryItem {
  id: string;
  vin: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  exteriorColor: string | null;
  status: string;
  daysInStock: number;
}

interface AssignVinPageProps {
  params: Promise<{ id: string }>;
}

export default function AssignVinPage({ params }: AssignVinPageProps) {
  const { id: orderId } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vin, setVin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchOrder = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const result = await res.json();

      if (result.success) {
        setOrder(result.data);
        if (result.data.vinNumber) {
          setVin(result.data.vinNumber);
        }
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

  const searchInventory = async () => {
    if (!order) return;

    setIsSearching(true);
    try {
      // Search for matching vehicles in inventory
      const params = new URLSearchParams({
        make: order.vehicle.make,
        model: order.vehicle.model,
        year: order.vehicle.year.toString(),
        status: 'IN_YARD',
      });

      const res = await fetch(`/api/stock/search?${params}`);
      const result = await res.json();

      if (result.success) {
        setSearchResults(result.data.items || []);
      }
    } catch (err) {
      console.error('Failed to search inventory:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vin || vin.length !== 17) {
      alert('Please enter a valid 17-character VIN');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/assign-vin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vin: vin.toUpperCase(),
          assignedBy: 'current-user-id', // Would come from auth context
        }),
      });

      const result = await res.json();

      if (result.success) {
        router.push(`/orders/${orderId}`);
      } else {
        alert(result.error?.message || 'Failed to assign VIN');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to assign VIN');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectFromInventory = (item: InventoryItem) => {
    setVin(item.vin);
  };

  if (isLoading) {
    return (
      <PageContainer title="Assign VIN" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      </PageContainer>
    );
  }

  if (error || !order) {
    return (
      <PageContainer title="Assign VIN" subtitle="Error loading data">
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

  if (order.vinNumber) {
    return (
      <PageContainer
        title="VIN Assigned"
        subtitle="This order already has a VIN assigned"
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
          <p className="text-lg font-medium mb-2">VIN Already Assigned</p>
          <p className="font-mono text-2xl text-gray-700">{order.vinNumber}</p>
          <div className="mt-6">
            <Link href={`/orders/${orderId}/portal`}>
              <Button>
                Activate Customer Portal
              </Button>
            </Link>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Assign VIN"
      subtitle={`${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}`}
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
        {/* Manual Entry */}
        <Card>
          <CardTitle className="mb-4">Enter VIN Manually</CardTitle>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Vehicle Identification Number (VIN)"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              placeholder="Enter 17-character VIN"
              maxLength={17}
            />
            <p className="text-sm text-gray-500">
              {vin.length}/17 characters
            </p>
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || vin.length !== 17}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Hash className="mr-2 h-4 w-4" />
                    Assign VIN
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Search Inventory */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Select from Inventory</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={searchInventory}
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search Matching
            </Button>
          </div>

          <div className="space-y-3">
            {searchResults.length > 0 ? (
              searchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectFromInventory(item)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    vin === item.vin
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 hover:border-violet-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm">{item.vin}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.year} {item.make} {item.model}
                        {item.variant && ` - ${item.variant}`}
                      </p>
                      {item.exteriorColor && (
                        <p className="text-xs text-gray-500">{item.exteriorColor}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant="default">
                        {item.daysInStock}d in stock
                      </Badge>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8">
                <Car className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">Click &quot;Search Matching&quot; to find vehicles</p>
                <p className="text-sm text-gray-400 mt-1">
                  Looking for: {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Order Info */}
      <Card className="mt-6">
        <CardTitle className="mb-4">Order Information</CardTitle>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Customer</p>
            <p className="font-medium">{order.customer.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Vehicle</p>
            <p className="font-medium">
              {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Variant</p>
            <p className="font-medium">{order.vehicle.variant || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-gray-500">Color</p>
            <p className="font-medium">{order.vehicle.color || 'Not specified'}</p>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
