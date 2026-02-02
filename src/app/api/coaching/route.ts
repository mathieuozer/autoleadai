import { NextRequest } from 'next/server';
import { successResponse, serverErrorResponse } from '@/lib/api/response';
import {
  generateCoachingInsights,
  generateBenchmarks,
  getDailyCoachingTip,
  getRelevantTalkTracks,
  TALK_TRACKS
} from '@/lib/sales-coaching';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'overview';
    const salespersonId = searchParams.get('salespersonId');

    if (type === 'talk-tracks') {
      // Get all talk tracks or filter by scenario
      const scenario = searchParams.get('scenario');
      if (scenario && TALK_TRACKS[scenario]) {
        return successResponse(TALK_TRACKS[scenario]);
      }
      return successResponse(Object.values(TALK_TRACKS));
    }

    if (type === 'relevant-tracks') {
      // Get relevant talk tracks based on order context
      const hasDeliveryDelay = searchParams.get('hasDeliveryDelay') === 'true';
      const financingPending = searchParams.get('financingPending') === 'true';
      const daysSinceContact = parseInt(searchParams.get('daysSinceContact') || '0');
      const vehicleInYard = searchParams.get('vehicleInYard') === 'true';
      const hasTradeIn = searchParams.get('hasTradeIn') === 'true';

      const tracks = getRelevantTalkTracks({
        hasDeliveryDelay,
        financingPending,
        daysSinceContact,
        vehicleInYard,
        hasTradeIn
      });

      return successResponse(tracks);
    }

    if (type === 'daily-tip') {
      return successResponse(getDailyCoachingTip());
    }

    // Default: return full coaching overview
    // In production, this would fetch real data from the database
    const mockPerformanceData = {
      conversionRate: 0.32,
      avgResponseTime: 2.5,
      followUpRate: 0.78,
      customerSatisfaction: 4.6,
      avgDealSize: 185000,
      cancellationRate: 0.08
    };

    const mockTeamBenchmarks = {
      avgConversionRate: 0.28,
      avgResponseTime: 3.2,
      avgFollowUpRate: 0.72,
      avgCustomerSatisfaction: 4.3,
      avgDealSize: 175000,
      avgCancellationRate: 0.12
    };

    const mockYourData = {
      conversionRate: 0.32,
      avgResponseTime: 2.5,
      followUpRate: 0.78,
      customerSatisfaction: 4.6,
      ordersThisMonth: 8,
      revenueThisMonth: 1480000
    };

    const mockTeamData = {
      avgConversionRate: 0.28,
      avgResponseTime: 3.2,
      avgFollowUpRate: 0.72,
      avgCustomerSatisfaction: 4.3,
      topConversionRate: 0.42,
      topResponseTime: 1.5,
      topOrdersThisMonth: 12,
      topRevenueThisMonth: 2200000
    };

    const insights = generateCoachingInsights(mockPerformanceData, mockTeamBenchmarks);
    const benchmarks = generateBenchmarks(mockYourData, mockTeamData);
    const dailyTip = getDailyCoachingTip();

    return successResponse({
      insights,
      benchmarks,
      dailyTip,
      talkTracksCount: Object.keys(TALK_TRACKS).length
    });
  } catch (error) {
    console.error('Error fetching coaching data:', error);
    return serverErrorResponse('Failed to fetch coaching data');
  }
}
