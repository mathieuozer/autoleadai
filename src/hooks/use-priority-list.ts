'use client';

import { useState, useEffect, useCallback } from 'react';
import { PriorityItem, PriorityListSummary, RiskLevel } from '@/types';

interface PriorityListStats {
  averageRiskScore: number;
  averageFulfillmentProbability: number;
  totalOrderValue: number;
  atRiskOrderValue: number;
}

interface PriorityListData {
  date: string;
  generatedAt: string;
  summary: PriorityListSummary;
  stats: PriorityListStats;
  items: PriorityItem[];
}

interface UsePriorityListOptions {
  salespersonId?: string;
  riskLevel?: RiskLevel;
  limit?: number;
}

interface UsePriorityListReturn {
  data: PriorityListData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePriorityList(options: UsePriorityListOptions = {}): UsePriorityListReturn {
  const [data, setData] = useState<PriorityListData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPriorityList = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.salespersonId) params.set('salespersonId', options.salespersonId);
      if (options.riskLevel) params.set('riskLevel', options.riskLevel);
      if (options.limit) params.set('limit', options.limit.toString());

      const url = `/api/priority-list${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch priority list');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [options.salespersonId, options.riskLevel, options.limit]);

  useEffect(() => {
    fetchPriorityList();
  }, [fetchPriorityList]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchPriorityList,
  };
}

// Helper to get today's actions
export function getTodayActions(items: PriorityItem[]): PriorityItem[] {
  return items.filter(
    item => item.nextBestAction.urgency === 'NOW' || item.nextBestAction.urgency === 'TODAY'
  );
}
