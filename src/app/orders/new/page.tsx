'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { CreateOrderForm } from '@/components/orders';
import { ArrowLeft, Loader2, AlertCircle, ShoppingBag } from 'lucide-react';

interface StockSelection {
  brandId: string;
  brandName: string;
  modelId: string;
  modelName: string;
  year: number;
  variantId: string;
  variantName: string;
  exteriorColorId: string;
  exteriorColorName: string;
  interiorColorId: string;
  interiorColorName: string;
  price: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface User {
  id: string;
  name: string;
  role: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [selection, setSelection] = useState<StockSelection | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salespersons, setSalespersons] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get stock selection from sessionStorage
    const storedSelection = sessionStorage.getItem('stockSelection');
    if (storedSelection) {
      try {
        setSelection(JSON.parse(storedSelection));
      } catch (e) {
        console.error('Failed to parse stock selection:', e);
      }
    }

    // Fetch customers and salespersons
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [customersRes, usersRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/users?role=SALESPERSON'),
      ]);

      const customersData = await customersRes.json();
      const usersData = await usersRes.json();

      if (customersData.success) {
        setCustomers(customersData.data);
      }
      if (usersData.success) {
        setSalespersons(usersData.data);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: {
    customerId: string;
    vehicleId: string;
    source: string;
    totalAmount: number;
    variantId?: string;
    exteriorColorId?: string;
    interiorColorId?: string;
    salespersonId?: string;
    expectedDeliveryDate?: string;
    bookingAmount?: number;
  }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // First, create or get a vehicle reference
      // For now, we'll create a temporary vehicle entry
      const vehicleRes = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: selection?.brandName,
          model: selection?.modelName,
          variant: selection?.variantName,
          year: selection?.year,
          color: selection?.exteriorColorName,
        }),
      });

      let vehicleId = data.vehicleId;
      const vehicleData = await vehicleRes.json();
      if (vehicleData.success && vehicleData.data?.id) {
        vehicleId = vehicleData.data.id;
      }

      // Create the order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          vehicleId: vehicleId || 'temp-vehicle-id', // Fallback for demo
        }),
      });

      const orderData = await orderRes.json();

      if (orderData.success) {
        // Clear the stock selection from session
        sessionStorage.removeItem('stockSelection');
        // Redirect to the new order
        router.push(`/orders/${orderData.data.id}`);
      } else {
        setError(orderData.error?.message || 'Failed to create order');
      }
    } catch (err) {
      console.error('Failed to create order:', err);
      setError('Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="New Order" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      </PageContainer>
    );
  }

  if (!selection) {
    return (
      <PageContainer title="New Order" subtitle="No vehicle selected">
        <Card className="p-8 text-center">
          <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <p className="text-gray-600 mb-4">
            No vehicle selection found. Please select a vehicle from stock first.
          </p>
          <Link href="/stock">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Stock Search
            </Button>
          </Link>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Create New Order"
      subtitle={`${selection.year} ${selection.brandName} ${selection.modelName} ${selection.variantName}`}
    >
      <div className="mb-6">
        <Link href="/stock">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stock Search
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="mb-6 p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      <div className="max-w-2xl mx-auto">
        <CreateOrderForm
          selection={selection}
          customers={customers.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
          }))}
          salespersons={salespersons.map(u => ({
            id: u.id,
            name: u.name,
          }))}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/stock')}
          isLoading={isSubmitting}
        />
      </div>
    </PageContainer>
  );
}
