import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse } from '@/lib/api/response';
import {
  calculateAgingScore,
  calculateCloseabilityScore,
  calculatePriorityScore,
  getUrgencyLevel,
  getRecommendedAction,
} from '@/lib/stock-scoring';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const urgency = searchParams.get('urgency'); // NOW, THIS_WEEK, THIS_MONTH

    // Get available inventory
    const inventory = await prisma.vehicleInventory.findMany({
      where: {
        status: { in: ['IN_TRANSIT', 'IN_YARD'] },
      },
      include: {
        variant: {
          include: {
            model: {
              include: { brand: true },
            },
            campaigns: {
              include: { campaign: true },
              where: {
                campaign: {
                  status: 'ACTIVE',
                  startDate: { lte: new Date() },
                  endDate: { gte: new Date() },
                },
              },
            },
          },
        },
        exteriorColor: true,
      },
    });

    // Get demand data (recent inquiries/test drives per variant)
    // In production, this would come from actual tracking data
    const demandData = await prisma.testDrive.groupBy({
      by: ['vehicleId'],
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _count: { id: true },
    });
    const demandMap = new Map(demandData.map(d => [d.vehicleId, d._count.id]));

    // Calculate priority scores
    const now = new Date();
    const priorityItems = inventory.map(item => {
      const agingScore = calculateAgingScore(item.stockDate, now);

      // Estimate closeability based on available data
      const hasActiveCampaign = (item.variant?.campaigns?.length || 0) > 0;

      const closeabilityScore = calculateCloseabilityScore({
        daysInStock: agingScore.daysInStock,
        recentInquiries: 0, // Would come from tracking
        recentTestDrives: demandMap.get(item.id) || 0,
        colorPopularity: 'MEDIUM', // Would be calculated from demand analysis
        hasActiveCampaign,
        isSeasonalFavorite: false, // Would be based on seasonality rules
      });

      const priorityScore = calculatePriorityScore(
        agingScore.score,
        closeabilityScore.score
      );

      const itemUrgency = getUrgencyLevel(priorityScore);
      const recommendedAction = getRecommendedAction(
        agingScore.score,
        closeabilityScore.score,
        hasActiveCampaign
      );

      return {
        id: item.id,
        vin: item.vin,
        vehicle: {
          brand: item.variant?.model?.brand?.name || 'Unknown',
          model: item.variant?.model?.name || 'Unknown',
          variant: item.variant?.name || 'Unknown',
          year: item.variant?.year || 0,
          color: item.exteriorColor?.name || 'Unknown',
        },
        status: item.status,
        stockDate: item.stockDate,
        daysInStock: agingScore.daysInStock,
        price: item.variant?.currentPrice ? Number(item.variant.currentPrice) : 0,
        scores: {
          aging: agingScore.score,
          agingRisk: agingScore.riskLevel,
          closeability: closeabilityScore.score,
          priority: priorityScore,
        },
        urgency: itemUrgency,
        recommendedAction,
        hasActiveCampaign,
        campaign: hasActiveCampaign ? {
          name: item.variant?.campaigns[0]?.campaign?.name,
          discountValue: item.variant?.campaigns[0]?.overrideDiscount
            ? Number(item.variant.campaigns[0].overrideDiscount)
            : Number(item.variant?.campaigns[0]?.campaign?.discountValue || 0),
        } : null,
        factors: {
          aging: agingScore.factors,
          closeability: closeabilityScore.factors,
        },
      };
    });

    // Filter by urgency if specified
    let filtered = priorityItems;
    if (urgency) {
      filtered = priorityItems.filter(
        item => item.urgency === urgency.toUpperCase()
      );
    }

    // Sort by priority score descending
    filtered.sort((a, b) => b.scores.priority - a.scores.priority);

    // Limit results
    const limited = filtered.slice(0, limit);

    // Summary by urgency
    const urgencySummary = {
      now: priorityItems.filter(i => i.urgency === 'NOW').length,
      thisWeek: priorityItems.filter(i => i.urgency === 'THIS_WEEK').length,
      thisMonth: priorityItems.filter(i => i.urgency === 'THIS_MONTH').length,
    };

    // Total value at risk (priority score > 60)
    const atRiskItems = priorityItems.filter(i => i.scores.priority >= 60);
    const atRiskValue = atRiskItems.reduce((sum, i) => sum + i.price, 0);

    return successResponse({
      items: limited,
      summary: {
        ...urgencySummary,
        total: priorityItems.length,
        atRiskValue,
        atRiskCount: atRiskItems.length,
        currency: 'AED',
      },
      filters: {
        urgency,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching priority push list:', error);
    return serverErrorResponse('Failed to fetch priority push list');
  }
}
