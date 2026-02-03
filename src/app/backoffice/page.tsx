'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import { StatCard } from '@/components/ui/StatCard';
import { PipelineStageCards, WorkflowTable } from '@/components/backoffice';
import type { PipelineStage, WorkflowItem } from '@/components/backoffice';
import {
  useBackofficeStats,
  useBackofficePipeline,
  useBackofficeWorkflow,
} from '@/hooks';

export default function BackofficePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Fetch data using hooks
  const { stats, isLoading: statsLoading } = useBackofficeStats();
  const { stages, isLoading: stagesLoading } = useBackofficePipeline();
  const {
    items: workflowItems,
    isLoading: workflowLoading,
    setSearch,
    setStageFilter,
  } = useBackofficeWorkflow();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update API search when debounced value changes
  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  // Update API stage filter when selected stage changes
  useEffect(() => {
    setStageFilter(selectedStage);
  }, [selectedStage, setStageFilter]);

  const handleStageClick = useCallback((stageId: string) => {
    setSelectedStage(prev => prev === stageId ? null : stageId);
  }, []);

  const handleRowClick = useCallback((orderId: string) => {
    router.push(`/orders/${orderId}`);
  }, [router]);

  // Transform pipeline stages to component format
  const pipelineStages: PipelineStage[] = stages.map(stage => ({
    id: stage.id,
    name: stage.name,
    count: stage.count,
    color: stage.color,
    change: stage.change,
  }));

  // Transform workflow items to component format
  const tableItems: WorkflowItem[] = workflowItems.map(item => ({
    id: item.id,
    orderNumber: item.orderNumber,
    customerName: item.customerName,
    vehicleInfo: item.vehicleInfo,
    stage: item.stage,
    assignee: item.assignee || { name: 'Unassigned' },
    slaStatus: item.slaStatus,
    slaTime: item.slaTime,
    priority: item.priority,
  }));

  const searchActions = (
    <div className="flex items-center gap-4">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] w-64"
        />
      </div>
      {/* Filter Button */}
      <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filters
      </button>
    </div>
  );

  // Loading state
  const isLoading = statsLoading || stagesLoading || workflowLoading;

  return (
    <PageContainer
      title="Back Office Operations"
      subtitle="Manage orders, workflows, and deliveries"
      actions={searchActions}
    >
      <div className="max-w-7xl mx-auto">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Active Orders"
            value={statsLoading ? '...' : (stats?.totalActiveOrders.value.toString() || '0')}
            trend={stats?.totalActiveOrders.trend}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            }
          />
          <StatCard
            title="SLA Compliance"
            value={statsLoading ? '...' : `${stats?.slaCompliance.value || 0}%`}
            trend={stats?.slaCompliance.trend}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="At Risk"
            value={statsLoading ? '...' : (stats?.atRiskOrders.value.toString() || '0')}
            subtitle={stats?.atRiskOrders.subtitle || 'Need attention'}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
          <StatCard
            title="Deliveries Today"
            value={statsLoading ? '...' : (stats?.deliveriesToday.value.toString() || '0')}
            subtitle={stats?.deliveriesToday.subtitle || '0 completed'}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            }
          />
        </div>

        {/* Pipeline Stage Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Overview</h2>
          {stagesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#7c3aed] border-t-transparent" />
            </div>
          ) : (
            <>
              <PipelineStageCards stages={pipelineStages} onStageClick={handleStageClick} />
              {selectedStage && (
                <div className="mt-2 text-sm text-gray-500">
                  Filtering by:{' '}
                  <span className="font-medium text-[#7c3aed]">
                    {pipelineStages.find((s) => s.id === selectedStage)?.name}
                  </span>
                  <button
                    onClick={() => setSelectedStage(null)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Workflow Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Workflows</h2>
            <button
              onClick={() => router.push('/orders')}
              className="text-sm font-medium text-[#7c3aed] hover:text-[#6d28d9] transition-colors"
            >
              View All
            </button>
          </div>
          {workflowLoading ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#7c3aed] border-t-transparent" />
            </div>
          ) : tableItems.length > 0 ? (
            <WorkflowTable items={tableItems} onRowClick={handleRowClick} />
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500">
                {debouncedSearch || selectedStage
                  ? 'No orders match your search criteria'
                  : 'No active workflows at the moment'}
              </p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
