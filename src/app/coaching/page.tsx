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
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  MessageSquare,
  Target,
  Award,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

interface CoachingInsight {
  id: string;
  type: 'strength' | 'improvement' | 'opportunity';
  title: string;
  description: string;
  actionable: string;
  impact: 'high' | 'medium' | 'low';
  relatedMetric?: string;
}

interface PerformanceBenchmark {
  metric: string;
  yourValue: number;
  teamAverage: number;
  topPerformer: number;
  percentile: number;
  trend: 'improving' | 'stable' | 'declining';
  insight: string;
}

interface DailyTip {
  tip: string;
  category: string;
  relevance: string;
}

interface CoachingData {
  insights: CoachingInsight[];
  benchmarks: PerformanceBenchmark[];
  dailyTip: DailyTip;
  talkTracksCount: number;
}

export default function CoachingPage() {
  const [data, setData] = useState<CoachingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'benchmarks' | 'talk-tracks'>('insights');

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/coaching');
      const result = await res.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch coaching data');
      }
    } catch (err) {
      setError('Failed to fetch coaching data');
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
      <PageContainer title="AI Sales Coaching" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      </PageContainer>
    );
  }

  if (error || !data) {
    return (
      <PageContainer title="AI Sales Coaching" subtitle="Error loading data">
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

  const insightTypeConfig = {
    strength: { color: 'bg-green-100 text-green-700', icon: Award },
    improvement: { color: 'bg-amber-100 text-amber-700', icon: Target },
    opportunity: { color: 'bg-blue-100 text-blue-700', icon: Lightbulb },
  };

  return (
    <PageContainer
      title="AI Sales Coaching"
      subtitle="Personalized insights to help you close more deals"
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

      {/* Daily Tip Banner */}
      <Card className="mb-6 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
            <Lightbulb className="h-5 w-5 text-violet-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-violet-900">Tip of the Day</p>
            <p className="text-violet-700 mt-1">{data.dailyTip.tip}</p>
            <p className="text-sm text-violet-500 mt-2">{data.dailyTip.relevance}</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'insights'
              ? 'bg-violet-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Insights ({data.insights.length})
        </button>
        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'benchmarks'
              ? 'bg-violet-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Benchmarks
        </button>
        <button
          onClick={() => setActiveTab('talk-tracks')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'talk-tracks'
              ? 'bg-violet-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Talk Tracks ({data.talkTracksCount})
        </button>
      </div>

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {data.insights.map((insight) => {
            const config = insightTypeConfig[insight.type];
            const Icon = config.icon;

            return (
              <Card key={insight.id}>
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.color.split(' ')[0]}`}>
                    <Icon className={`h-5 w-5 ${config.color.split(' ')[1]}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{insight.title}</span>
                      <Badge
                        variant={insight.impact === 'high' ? 'danger' : insight.impact === 'medium' ? 'warning' : 'default'}
                        size="sm"
                      >
                        {insight.impact} impact
                      </Badge>
                    </div>
                    <p className="text-gray-600">{insight.description}</p>
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Action:</p>
                      <p className="text-sm text-gray-600">{insight.actionable}</p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {data.insights.length === 0 && (
            <Card className="text-center py-12">
              <Award className="mx-auto mb-4 h-12 w-12 text-green-400" />
              <p className="text-gray-500">You're doing great! No improvement areas identified.</p>
            </Card>
          )}
        </div>
      )}

      {/* Benchmarks Tab */}
      {activeTab === 'benchmarks' && (
        <div className="space-y-4">
          {data.benchmarks.map((benchmark) => (
            <Card key={benchmark.metric}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">{benchmark.metric}</h3>
                  <p className="text-sm text-gray-500">{benchmark.insight}</p>
                </div>
                <div className="flex items-center gap-2">
                  {benchmark.trend === 'improving' && (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  )}
                  {benchmark.trend === 'declining' && (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                  {benchmark.trend === 'stable' && (
                    <Minus className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-500 capitalize">{benchmark.trend}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-violet-50 rounded-lg">
                  <p className="text-2xl font-bold text-violet-600">
                    {typeof benchmark.yourValue === 'number' && benchmark.yourValue < 10
                      ? benchmark.yourValue.toFixed(1)
                      : Math.round(benchmark.yourValue)}
                    {benchmark.metric.includes('Rate') || benchmark.metric.includes('Rating') ? '' : ''}
                  </p>
                  <p className="text-xs text-gray-500">Your Score</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">
                    {typeof benchmark.teamAverage === 'number' && benchmark.teamAverage < 10
                      ? benchmark.teamAverage.toFixed(1)
                      : Math.round(benchmark.teamAverage)}
                  </p>
                  <p className="text-xs text-gray-500">Team Avg</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {typeof benchmark.topPerformer === 'number' && benchmark.topPerformer < 10
                      ? benchmark.topPerformer.toFixed(1)
                      : Math.round(benchmark.topPerformer)}
                  </p>
                  <p className="text-xs text-gray-500">Top Performer</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-violet-500 rounded-full"
                  style={{ width: `${benchmark.percentile}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {benchmark.percentile}th percentile
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Talk Tracks Tab */}
      {activeTab === 'talk-tracks' && (
        <div className="space-y-4">
          <TalkTrackCard
            title="Delivery Delay Notification"
            scenario="When vehicle delivery is delayed"
            successRate={78}
          />
          <TalkTrackCard
            title="Financing Follow-up"
            scenario="When financing is pending > 48h"
            successRate={82}
          />
          <TalkTrackCard
            title="Breaking Customer Silence"
            scenario="When no contact for 7+ days"
            successRate={65}
          />
          <TalkTrackCard
            title="Vehicle Arrived in Yard"
            scenario="When vehicle is ready for delivery"
            successRate={91}
          />
          <TalkTrackCard
            title="Price Objection Handling"
            scenario="When customer asks for discount"
            successRate={72}
          />
          <TalkTrackCard
            title="Trade-in Discussion"
            scenario="When discussing trade-in value"
            successRate={75}
          />
        </div>
      )}
    </PageContainer>
  );
}

function TalkTrackCard({ title, scenario, successRate }: {
  title: string;
  scenario: string;
  successRate: number;
}) {
  return (
    <Link href={`/coaching/talk-tracks/${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
              <MessageSquare className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{scenario}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">{successRate}%</p>
              <p className="text-xs text-gray-500">success rate</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
