'use client';

import { useState, useEffect, useCallback } from 'react';

export interface DocumentData {
  id: string;
  type: string;
  status: string;
  name: string;
  fileName: string | null;
  fileSize: number | null;
  uploadedAt: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
}

export interface CustomerOrderData {
  id: string;
  status: string;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
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
  } | null;
  createdAt: string;
  expectedDeliveryDate: string | null;
  deliveredAt: string | null;
  financingStatus: string;
  portalActivated: boolean;
  portalActivatedAt: string | null;
  activities: Array<{
    id: string;
    type: string;
    channel: string;
    summary: string;
    performedAt: string;
  }>;
  documents: DocumentData[];
  stats: {
    currentStep: number;
    totalSteps: number;
    daysToDelivery: number | null;
    documentsApproved: number;
    documentsTotal: number;
    paymentPercentage: number;
    amountPaid: number;
    totalAmount: number;
  };
}

interface UseCustomerOrderReturn {
  order: CustomerOrderData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  scheduleDelivery: (date: string, notes?: string) => Promise<boolean>;
  submitSupportRequest: (subject: string, message: string, category?: string) => Promise<{ ticketNumber?: string } | false>;
}

export function useCustomerOrder(orderId: string): UseCustomerOrderReturn {
  const [order, setOrder] = useState<CustomerOrderData | null>(null);
  const [isLoading, setIsLoading] = useState(!!orderId);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/portal/order?orderId=${orderId}`);
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

  const scheduleDelivery = useCallback(async (date: string, notes?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/portal/delivery/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, deliveryDate: date, notes }),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to schedule delivery');
      }

      await fetchOrder();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule delivery');
      return false;
    }
  }, [orderId, fetchOrder]);

  const submitSupportRequest = useCallback(async (
    subject: string,
    message: string,
    category?: string
  ): Promise<{ ticketNumber?: string } | false> => {
    try {
      const response = await fetch('/api/portal/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, subject, message, category }),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to submit support request');
      }

      return { ticketNumber: result.data.ticketNumber };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit support request');
      return false;
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    isLoading,
    error,
    refetch: fetchOrder,
    scheduleDelivery,
    submitSupportRequest,
  };
}
