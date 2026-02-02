import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // ACTIVE, EXPIRED, ALL

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status === 'ACTIVE') {
      where.status = 'ACTIVE';
      where.startDate = { lte: new Date() };
      where.endDate = { gte: new Date() };
    } else if (status === 'EXPIRED') {
      where.OR = [
        { status: 'EXPIRED' },
        { endDate: { lt: new Date() } },
      ];
    }

    // Get campaigns with their variants
    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        variants: {
          include: {
            variant: {
              include: {
                model: {
                  include: { brand: true },
                },
                inventory: {
                  where: { status: { in: ['RESERVED', 'SOLD'] } },
                },
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    // Calculate effectiveness metrics for each campaign
    const campaignMetrics = campaigns.map(campaign => {
      const now = new Date();
      const startDate = new Date(campaign.startDate);
      const endDate = new Date(campaign.endDate);
      const daysActive = Math.max(1, Math.floor((Math.min(now.getTime(), endDate.getTime()) - startDate.getTime()) / (1000 * 60 * 60 * 24)));

      // Count sales attributed to this campaign
      const totalSales = campaign.variants.reduce((sum, cv) => {
        return sum + cv.variant.inventory.filter(i => i.status === 'SOLD').length;
      }, 0);

      // Calculate total potential discount given
      const totalDiscountGiven = campaign.variants.reduce((sum, cv) => {
        const discountPerUnit = cv.overrideDiscount
          ? Number(cv.overrideDiscount)
          : campaign.discountType === 'PERCENTAGE'
            ? Number(cv.variant.currentPrice) * Number(campaign.discountValue || 0) / 100
            : Number(campaign.discountValue || 0);
        const soldUnits = cv.variant.inventory.filter(i => i.status === 'SOLD').length;
        return sum + discountPerUnit * soldUnits;
      }, 0);

      // Covered variants count
      const coveredVariants = campaign.variants.length;
      const coveredBrands = [...new Set(campaign.variants.map(cv => cv.variant.model.brand.name))];

      // Calculate sales velocity (sales per day)
      const salesVelocity = totalSales / daysActive;

      // Effectiveness score (simple calculation)
      // Higher is better: sales velocity relative to discount spend
      const effectivenessScore = totalDiscountGiven > 0
        ? Math.round((totalSales * 100) / (totalDiscountGiven / 1000))
        : 0;

      return {
        id: campaign.id,
        name: campaign.name,
        code: campaign.code,
        type: campaign.type,
        status: endDate < now ? 'EXPIRED' : campaign.status,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        daysActive,
        daysRemaining: endDate > now ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
        discountType: campaign.discountType,
        discountValue: campaign.discountValue ? Number(campaign.discountValue) : null,
        metrics: {
          totalSales,
          totalRedemptions: campaign.totalRedemptions,
          totalSalesValue: Number(campaign.totalSalesValue),
          totalDiscountGiven,
          salesVelocity: Math.round(salesVelocity * 100) / 100,
          effectivenessScore,
          coveredVariants,
          coveredBrands,
        },
        variants: campaign.variants.slice(0, 5).map(cv => ({
          id: cv.variant.id,
          name: `${cv.variant.model.brand.name} ${cv.variant.model.name} ${cv.variant.name}`,
          sales: cv.variant.inventory.filter(i => i.status === 'SOLD').length,
          discount: cv.overrideDiscount
            ? Number(cv.overrideDiscount)
            : Number(campaign.discountValue || 0),
        })),
      };
    });

    // Sort by effectiveness score
    campaignMetrics.sort((a, b) => b.metrics.effectivenessScore - a.metrics.effectivenessScore);

    // Summary
    const activeCampaigns = campaignMetrics.filter(c => c.status === 'ACTIVE');
    const summary = {
      totalCampaigns: campaignMetrics.length,
      activeCampaigns: activeCampaigns.length,
      totalSalesFromCampaigns: campaignMetrics.reduce((sum, c) => sum + c.metrics.totalSales, 0),
      totalDiscountGiven: campaignMetrics.reduce((sum, c) => sum + c.metrics.totalDiscountGiven, 0),
      avgEffectivenessScore: campaignMetrics.length > 0
        ? Math.round(campaignMetrics.reduce((sum, c) => sum + c.metrics.effectivenessScore, 0) / campaignMetrics.length)
        : 0,
      topPerforming: campaignMetrics.slice(0, 3).map(c => ({
        name: c.name,
        sales: c.metrics.totalSales,
        effectiveness: c.metrics.effectivenessScore,
      })),
      currency: 'AED',
    };

    // Recommendations
    const recommendations = [];

    // Find underperforming active campaigns
    const underperformingActive = activeCampaigns.filter(
      c => c.metrics.effectivenessScore < 10 && c.daysActive >= 7
    );
    if (underperformingActive.length > 0) {
      recommendations.push({
        type: 'UNDERPERFORMING',
        priority: 'HIGH',
        message: `${underperformingActive.length} active campaigns are underperforming`,
        action: 'Consider increasing discount or expanding coverage',
        campaigns: underperformingActive.map(c => c.name),
      });
    }

    // Find campaigns expiring soon
    const expiringSoon = activeCampaigns.filter(c => c.daysRemaining <= 7);
    if (expiringSoon.length > 0) {
      recommendations.push({
        type: 'EXPIRING',
        priority: 'MEDIUM',
        message: `${expiringSoon.length} campaigns expiring within 7 days`,
        action: 'Review performance and decide on extension',
        campaigns: expiringSoon.map(c => c.name),
      });
    }

    return successResponse({
      campaigns: campaignMetrics,
      summary,
      recommendations,
      filters: { status },
    });
  } catch (error) {
    console.error('Error fetching campaign effectiveness:', error);
    return serverErrorResponse('Failed to fetch campaign effectiveness');
  }
}
