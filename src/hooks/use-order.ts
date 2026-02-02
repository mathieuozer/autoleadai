'use client';

import { useState, useEffect, useCallback } from 'react';

interface OrderData {
  id: string;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  expectedDeliveryDate: string | null;
  deliveredAt: string | null;
  totalAmount: number;
  bookingAmount: number | null;
  financingStatus: string;
  riskScore: number;
  riskLevel: string;
  fulfillmentProbability: number;
  lastContactAt: string | null;
  lastContactDaysAgo: number | null;
  vinNumber: string | null;
  portalActivated: boolean;
  portalActivatedAt: string | null;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    preferredChannel: string | null;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    variant: string | null;
    year: number;
    color: string | null;
    vin: string | null;
  };
  salesperson: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
  } | null;
  activities: Array<{
    id: string;
    type: string;
    channel: string;
    summary: string;
    details: string | null;
    sentiment: string | null;
    performedAt: string;
    duration: number | null;
    performedBy: {
      id: string;
      name: string;
      avatar: string | null;
    } | null;
  }>;
  latestPriority: {
    id: string;
    rank: number;
    riskScore: number;
    riskLevel: string;
    riskFactors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
    nextBestAction: {
      action: string;
      channel: string;
      urgency: string;
      suggestedMessage?: string;
      expectedImpact: string;
      reasoning: string;
    };
    generatedAt: string;
  } | null;
}

interface UseOrderReturn {
  order: OrderData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateOrder: (data: Partial<OrderData>) => Promise<boolean>;
}

export function useOrder(orderId: string): UseOrderReturn {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch order');
      }

      setOrder(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  const updateOrder = useCallback(async (data: Partial<OrderData>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update order');
      }

      // Refetch to get updated data
      await fetchOrder();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
      return false;
    }
  }, [orderId, fetchOrder]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    isLoading,
    error,
    refetch: fetchOrder,
    updateOrder,
  };
}

export function useLogActivity() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logActivity = useCallback(async (data: {
    orderId: string;
    type: string;
    channel: string;
    summary: string;
    details?: string;
    sentiment?: string;
    performedById?: string;
    duration?: number;
  }): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to log activity');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log activity');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { logActivity, isLoading, error };
}
