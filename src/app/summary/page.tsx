'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout';
import { Card, CardTitle, Button, Badge } from '@/components/ui';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Phone,
  MessageSquare,
  Mail,
  TrendingDown,
  Calendar,
  DollarSign,
  CheckCircle,
  Star,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface DailySummary {
  date: string;
  salespersonName: string;
  activities: {
    callsMade: number;
    messagesSent: number;
    emailsSent: number;
    totalTouchpoints: number;
    ordersContacted: number;
  };
  impact: {
    riskReductionPercent: number;
    ordersMovedForward: number;
    potentialRevenueSaved: number;
    cancellationsAvoided: number;
    deliveriesScheduled: number;
  };
  wins: Array<{
    type: string;
    description: string;
    value?: number;
    customerName: string;
  }>;
  comparison: {
    vsYesterday: number;
    vsWeekAverage: number;
    vsTeamAverage: number;
  };
  feedback: string;
  motivationalMessage: string;
  tomorrowFocus: Array<{
    priority: 'high' | 'medium';
    action: string;
    reason: string;
    orderId?: string;
  }>;
}

export default function DailySummaryPage() {
  const [data, setData] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/summary/daily');
      const result = await res.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch summary');
      }
    } catch (err) {
      setError('Failed to fetch summary');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <PageContainer title="Daily Summary" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      </PageContainer>
    );
  }

  if (error || !data) {
    return (
      <PageContainer title="Daily Summary" subtitle="Error loading data">
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

  const getComparisonColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getComparisonIcon = (value: number) => {
    if (value > 0) return '↑';
    if (value < 0) return '↓';
    return '→';
  };

  return (
    <PageContainer
      title="End of Day Summary"
      subtitle={new Date(data.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })}
    >
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Feedback Banner */}
      <Card className="mb-6 bg-gradient-to-r from-violet-500 to-purple-600 text-white">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-medium">{data.feedback}</p>
            <p className="text-violet-100 mt-2">{data.motivationalMessage}</p>
          </div>
        </div>
      </Card>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 mx-auto mb-2">
            <Phone className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold">{data.activities.callsMade}</p>
          <p className="text-sm text-gray-500">Calls Made</p>
        </Card>
        <Card className="text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 mx-auto mb-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold">{data.activities.messagesSent}</p>
          <p className="text-sm text-gray-500">Messages Sent</p>
        </Card>
        <Card className="text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 mx-auto mb-2">
            <Mail className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold">{data.activities.emailsSent}</p>
          <p className="text-sm text-gray-500">Emails Sent</p>
        </Card>
        <Card className="text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 mx-auto mb-2">
            <Calendar className="h-5 w-5 text-violet-600" />
          </div>
          <p className="text-2xl font-bold">{data.activities.ordersContacted}</p>
          <p className="text-sm text-gray-500">Orders Contacted</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Impact Section */}
        <Card>
          <CardTitle className="mb-4">Your Impact Today</CardTitle>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-green-600" />
                <span>Risk Reduced</span>
              </div>
              <span className="text-xl font-bold text-green-600">
                {data.impact.riskReductionPercent}%
              </span>
            </div>

            {data.impact.cancellationsAvoided > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span>Cancellations Avoided</span>
                </div>
                <span className="text-xl font-bold text-blue-600">
                  {data.impact.cancellationsAvoided}
                </span>
              </div>
            )}

            {data.impact.potentialRevenueSaved > 0 && (
              <div className="flex items-center justify-between p-3 bg-violet-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-violet-600" />
                  <span>Revenue Protected</span>
                </div>
                <span className="text-xl font-bold text-violet-600">
                  {formatCurrency(data.impact.potentialRevenueSaved)}
                </span>
              </div>
            )}

            {data.impact.deliveriesScheduled > 0 && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  <span>Deliveries Scheduled</span>
                </div>
                <span className="text-xl font-bold text-amber-600">
                  {data.impact.deliveriesScheduled}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Comparison Section */}
        <Card>
          <CardTitle className="mb-4">Performance Comparison</CardTitle>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">vs. Yesterday</span>
              <span className={`font-bold ${getComparisonColor(data.comparison.vsYesterday)}`}>
                {getComparisonIcon(data.comparison.vsYesterday)} {Math.abs(data.comparison.vsYesterday)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">vs. Your Weekly Average</span>
              <span className={`font-bold ${getComparisonColor(data.comparison.vsWeekAverage)}`}>
                {getComparisonIcon(data.comparison.vsWeekAverage)} {Math.abs(data.comparison.vsWeekAverage)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">vs. Team Average</span>
              <span className={`font-bold ${getComparisonColor(data.comparison.vsTeamAverage)}`}>
                {getComparisonIcon(data.comparison.vsTeamAverage)} {Math.abs(data.comparison.vsTeamAverage)}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Wins Section */}
      {data.wins.length > 0 && (
        <Card className="mt-6">
          <CardTitle className="mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Today&apos;s Wins
            </div>
          </CardTitle>
          <div className="space-y-3">
            {data.wins.map((win, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">{win.description}</p>
                  {win.value && (
                    <p className="text-sm text-gray-500">{formatCurrency(win.value)}</p>
                  )}
                </div>
                <Badge variant="success">{win.type}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tomorrow's Focus */}
      <Card className="mt-6">
        <CardTitle className="mb-4">Tomorrow&apos;s Focus</CardTitle>
        <div className="space-y-3">
          {data.tomorrowFocus.map((item, index) => (
            <div
              key={index}
              className={`flex items-center gap-4 p-4 rounded-lg border-l-4 ${
                item.priority === 'high'
                  ? 'bg-red-50 border-red-500'
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="flex-1">
                <p className="font-medium">{item.action}</p>
                <p className="text-sm text-gray-500">{item.reason}</p>
              </div>
              <Badge variant={item.priority === 'high' ? 'danger' : 'default'}>
                {item.priority}
              </Badge>
              {item.orderId && (
                <Link href={`/orders/${item.orderId}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </Card>
    </PageContainer>
  );
}
