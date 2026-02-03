'use client';

import { useState, useEffect, useCallback } from 'react';

export interface BackofficeStats {
  totalActiveOrders: {
    value: number;
    trend?: {
      value: number;
      direction: 'up' | 'down';
      label: string;
    };
  };
  slaCompliance: {
    value: number;
    trend?: {
      value: number;
      direction: 'up' | 'down';
      label: string;
    };
  };
  atRiskOrders: {
    value: number;
    subtitle: string;
  };
  deliveriesToday: {
    value: number;
    subtitle: string;
  };
}

export interface PipelineStage {
  id: string;
  name: string;
  count: number;
  color: string;
  change?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export interface WorkflowItem {
  id: string;
  orderNumber: string;
  customerName: string;
  vehicleInfo: string;
  stage: string;
  assignee: { name: string } | null;
  slaStatus: 'on-track' | 'at-risk' | 'overdue';
  slaTime: string;
  priority?: 'high';
}

interface UseBackofficeStatsReturn {
  stats: BackofficeStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseBackofficePipelineReturn {
  stages: PipelineStage[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseBackofficeWorkflowReturn {
  items: WorkflowItem[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setStageFilter: (stage: string | null) => void;
}

export function useBackofficeStats(): UseBackofficeStatsReturn {
  const [stats, setStats] = useState<BackofficeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/backoffice/stats');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch stats');
      }

      setStats(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}

export function useBackofficePipeline(): UseBackofficePipelineReturn {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPipeline = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/backoffice/pipeline');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch pipeline');
      }

      setStages(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  return { stages, isLoading, error, refetch: fetchPipeline };
}

export function useBackofficeWorkflow(): UseBackofficeWorkflowReturn {
  const [items, setItems] = useState<WorkflowItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchWorkflow = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      });

      if (search) {
        params.set('search', search);
      }

      if (stageFilter) {
        params.set('stage', stageFilter);
      }

      const response = await fetch(`/api/backoffice/workflow?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch workflow');
      }

      setItems(result.data);
      if (result.meta) {
        setPagination(result.meta);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, stageFilter]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  // Reset to page 1 when search or filter changes
  const handleSetSearch = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  }, []);

  const handleSetStageFilter = useCallback((newStage: string | null) => {
    setStageFilter(newStage);
    setPage(1);
  }, []);

  return {
    items,
    isLoading,
    error,
    pagination,
    refetch: fetchWorkflow,
    setPage,
    setSearch: handleSetSearch,
    setStageFilter: handleSetStageFilter,
  };
}

// Combined hook for convenience
export function useBackoffice() {
  const stats = useBackofficeStats();
  const pipeline = useBackofficePipeline();
  const workflow = useBackofficeWorkflow();

  const refetchAll = useCallback(async () => {
    await Promise.all([
      stats.refetch(),
      pipeline.refetch(),
      workflow.refetch(),
    ]);
  }, [stats, pipeline, workflow]);

  return {
    stats: stats.stats,
    statsLoading: stats.isLoading,
    statsError: stats.error,
    stages: pipeline.stages,
    stagesLoading: pipeline.isLoading,
    stagesError: pipeline.error,
    workflowItems: workflow.items,
    workflowLoading: workflow.isLoading,
    workflowError: workflow.error,
    workflowPagination: workflow.pagination,
    setWorkflowPage: workflow.setPage,
    setWorkflowSearch: workflow.setSearch,
    setWorkflowStageFilter: workflow.setStageFilter,
    refetchAll,
  };
}
