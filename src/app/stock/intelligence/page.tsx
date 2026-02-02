'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { StockOverviewCard, PriorityPushList } from '@/components/stock/intelligence';
import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface StockOverviewData {
  health: {
    healthScore: number;
    freshPercentage: number;
    agingPercentage: number;
    criticalPercentage: number;
    avgDaysInStock: number;
    turnoverRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  counts: {
    total: number;
    inTransit: number;
    inYard: number;
    reserved: number;
    sold: number;
  };
  value: {
    total: number;
    atRisk: number;
    atRiskPercentage: number;
    currency: string;
  };
  aging: {
    fresh: number;
    aging: number;
    stale: number;
    critical: number;
  };
  topBrands: Array<{ name: string; count: number }>;
}

interface PriorityData {
  items: any[];
  summary: {
    now: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
    atRiskValue: number;
    atRiskCount: number;
    currency: string;
  };
}

export default function StockIntelligencePage() {
  const [overview, setOverview] = useState<StockOverviewData | null>(null);
  const [priority, setPriority] = useState<PriorityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'priority'>('overview');

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [overviewRes, priorityRes] = await Promise.all([
        fetch('/api/stock/intelligence/overview'),
        fetch('/api/stock/intelligence/priority-push?limit=20'),
      ]);

      const overviewData = await overviewRes.json();
      const priorityData = await priorityRes.json();

      if (overviewData.success) {
        setOverview(overviewData.data);
      }
      if (priorityData.success) {
        setPriority(priorityData.data);
      }
    } catch (err) {
      setError('Failed to fetch stock intelligence data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <PageContainer title="Stock Intelligence" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Stock Intelligence" subtitle="Error loading data">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Stock Intelligence"
      subtitle="AI-powered inventory insights and recommendations"
    >
      <div className="mb-6 flex items-center justify-between">
        <Link href="/stock">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stock Search
          </Button>
        </Link>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-violet-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('priority')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'priority'
              ? 'bg-violet-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Priority Push ({priority?.summary.now || 0} urgent)
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && overview && (
        <StockOverviewCard
          health={overview.health}
          counts={overview.counts}
          value={overview.value}
          aging={overview.aging}
          topBrands={overview.topBrands}
        />
      )}

      {activeTab === 'priority' && priority && (
        <PriorityPushList
          items={priority.items}
          summary={priority.summary}
          onViewDetails={(item) => console.log('View details:', item)}
        />
      )}
    </PageContainer>
  );
}
