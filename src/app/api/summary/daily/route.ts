import { NextRequest } from 'next/server';
import { successResponse, serverErrorResponse } from '@/lib/api/response';
import { generateDailySummary, getMotivationalMessage } from '@/lib/daily-summary';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const salespersonId = searchParams.get('salespersonId') || 'current-user';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // In production, this would fetch real data from the database
    // For now, generate mock data that demonstrates the feature
    const mockTodayActivities = [
      { type: 'CALL_OUTBOUND', orderId: 'ord-1', customerName: 'Ahmed Al Maktoum', result: 'connected' },
      { type: 'CALL_OUTBOUND', orderId: 'ord-2', customerName: 'Sarah Johnson', result: 'voicemail' },
      { type: 'WHATSAPP_SENT', orderId: 'ord-1', customerName: 'Ahmed Al Maktoum', result: 'delivered' },
      { type: 'WHATSAPP_SENT', orderId: 'ord-3', customerName: 'Mohammed Hassan', result: 'read' },
      { type: 'CALL_OUTBOUND', orderId: 'ord-4', customerName: 'Fatima Ali', result: 'connected' },
      { type: 'EMAIL_SENT', orderId: 'ord-5', customerName: 'John Smith', result: 'sent' },
      { type: 'CALL_OUTBOUND', orderId: 'ord-3', customerName: 'Mohammed Hassan', result: 'connected' },
    ];

    const mockOrderChanges = [
      { orderId: 'ord-1', customerName: 'Ahmed Al Maktoum', previousRisk: 72, currentRisk: 45, statusChange: undefined, value: 285000 },
      { orderId: 'ord-3', customerName: 'Mohammed Hassan', previousRisk: 65, currentRisk: 40, statusChange: 'FINANCING_APPROVED', value: 195000 },
      { orderId: 'ord-4', customerName: 'Fatima Ali', previousRisk: 35, currentRisk: 25, statusChange: 'READY_FOR_DELIVERY', value: 245000 },
      { orderId: 'ord-5', customerName: 'John Smith', previousRisk: 50, currentRisk: 48, statusChange: undefined, value: 175000 },
    ];

    const mockYesterdayMetrics = { touchpoints: 5, riskReduction: 18 };
    const mockWeekAverageMetrics = { touchpoints: 6, riskReduction: 15 };
    const mockTeamAverageMetrics = { touchpoints: 5, riskReduction: 12 };

    const mockTomorrowPriorities = [
      { orderId: 'ord-2', action: 'Follow up call - no answer today', urgency: 'TODAY', reason: 'Financing pending > 48h' },
      { orderId: 'ord-6', action: 'Proactive update on delivery delay', urgency: 'NOW', reason: 'ETA changed, customer not informed' },
      { orderId: 'ord-7', action: 'Check-in message', urgency: 'THIS_WEEK', reason: 'No contact in 5 days' },
    ];

    const summary = generateDailySummary(
      { id: salespersonId, name: 'Sales Executive' },
      mockTodayActivities,
      mockOrderChanges,
      mockYesterdayMetrics,
      mockWeekAverageMetrics,
      mockTeamAverageMetrics,
      mockTomorrowPriorities
    );

    const motivationalMessage = getMotivationalMessage(summary);

    return successResponse({
      ...summary,
      motivationalMessage,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating daily summary:', error);
    return serverErrorResponse('Failed to generate daily summary');
  }
}
