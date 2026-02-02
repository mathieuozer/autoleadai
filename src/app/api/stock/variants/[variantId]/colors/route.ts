import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, notFoundResponse } from '@/lib/api/response';
import {
  generateColorRecommendations,
  getBestColorToClose,
  ColorStockData,
  ColorDemandData,
} from '@/lib/color-recommendation';

interface RouteContext {
  params: Promise<{ variantId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { variantId } = await context.params;

    // Verify variant exists and get details
    const variant = await prisma.vehicleVariant.findUnique({
      where: { id: variantId },
      include: {
        model: {
          include: { brand: true },
        },
      },
    });

    if (!variant) {
      return notFoundResponse('Variant not found');
    }

    // Get color combinations
    const colorCombinations = await prisma.colorCombination.findMany({
      where: { variantId },
      include: {
        exteriorColor: true,
        interiorColor: true,
      },
    });

    // Get inventory counts by color
    const inventory = await prisma.vehicleInventory.groupBy({
      by: ['exteriorColorId', 'interiorColorId'],
      where: {
        variantId,
        status: { in: ['IN_TRANSIT', 'IN_YARD'] },
      },
      _count: { id: true },
      _avg: { agingDays: true },
    });

    // Get active campaigns for this variant
    const activeCampaigns = await prisma.campaignVariant.findMany({
      where: {
        variantId,
        campaign: {
          status: 'ACTIVE',
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
      },
      include: {
        campaign: true,
      },
    });

    const hasActiveCampaign = activeCampaigns.length > 0;

    // Get demand data (from ColorDemandAnalysis if available)
    const demandAnalysis = await prisma.colorDemandAnalysis.findMany({
      where: { variantId },
      orderBy: { month: 'desc' },
      take: 1, // Latest month
    });

    // Build stock data for recommendations
    const stockData: ColorStockData[] = inventory.map(inv => ({
      exteriorColorId: inv.exteriorColorId,
      interiorColorId: inv.interiorColorId || '',
      count: inv._count.id,
      avgDaysInStock: inv._avg.agingDays || 0,
      hasActiveCampaign,
    }));

    // Build demand data
    const demandData: ColorDemandData[] = demandAnalysis.map(d => ({
      exteriorColorId: d.exteriorColorId,
      inquiryCount: d.inquiryCount,
      testDriveCount: d.testDriveCount,
      orderCount: d.orderCount,
      deliveryCount: d.deliveryCount,
      avgStockLevel: d.avgStockLevel,
      stockouts: d.stockouts,
    }));

    // Generate AI recommendations
    const recommendations = generateColorRecommendations(variantId, stockData, demandData);
    const bestColor = getBestColorToClose(recommendations);

    // Transform color combinations with availability
    const inventoryMap = new Map<string, { count: number; avgDays: number }>();
    inventory.forEach(inv => {
      const key = `${inv.exteriorColorId}-${inv.interiorColorId || 'none'}`;
      inventoryMap.set(key, {
        count: inv._count.id,
        avgDays: inv._avg.agingDays || 0,
      });
    });

    const exteriorColors = new Map<string, {
      id: string;
      name: string;
      code: string;
      hexColor: string;
      totalStock: number;
      isRecommended: boolean;
      recommendation?: {
        score: number;
        reason: string;
        badges: Array<{ type: string; label: string }>;
      };
      interiorOptions: Array<{
        id: string;
        name: string;
        code: string;
        hexColor: string;
        stockCount: number;
        imageUrl: string | null;
      }>;
    }>();

    colorCombinations.forEach(combo => {
      const key = `${combo.exteriorColorId}-${combo.interiorColorId}`;
      const stockInfo = inventoryMap.get(key) || { count: 0, avgDays: 0 };
      const rec = recommendations.find(
        r => r.exteriorColorId === combo.exteriorColorId && r.interiorColorId === combo.interiorColorId
      );

      if (!exteriorColors.has(combo.exteriorColorId)) {
        const isRecommended = bestColor?.exteriorColorId === combo.exteriorColorId;
        exteriorColors.set(combo.exteriorColorId, {
          id: combo.exteriorColor.id,
          name: combo.exteriorColor.name,
          code: combo.exteriorColor.code,
          hexColor: combo.exteriorColor.hexColor,
          totalStock: 0,
          isRecommended,
          recommendation: rec ? {
            score: rec.score,
            reason: rec.reason,
            badges: rec.badges,
          } : undefined,
          interiorOptions: [],
        });
      }

      const exterior = exteriorColors.get(combo.exteriorColorId)!;
      exterior.totalStock += stockInfo.count;
      exterior.interiorOptions.push({
        id: combo.interiorColor.id,
        name: combo.interiorColor.name,
        code: combo.interiorColor.code,
        hexColor: combo.interiorColor.hexColor,
        stockCount: stockInfo.count,
        imageUrl: combo.imageUrl,
      });
    });

    // Sort exterior colors: recommended first, then by stock
    const sortedExteriorColors = Array.from(exteriorColors.values())
      .sort((a, b) => {
        if (a.isRecommended) return -1;
        if (b.isRecommended) return 1;
        return b.totalStock - a.totalStock;
      });

    return successResponse({
      variant: {
        id: variant.id,
        name: variant.name,
        year: variant.year,
        model: variant.model.name,
        brand: variant.model.brand.name,
        currentPrice: Number(variant.currentPrice),
      },
      bestColorRecommendation: bestColor ? {
        exteriorColorId: bestColor.exteriorColorId,
        interiorColorId: bestColor.interiorColorId,
        score: bestColor.score,
        reason: bestColor.reason,
        badges: bestColor.badges,
      } : null,
      exteriorColors: sortedExteriorColors,
      hasActiveCampaign,
    });
  } catch (error) {
    console.error('Error fetching colors:', error);
    return serverErrorResponse('Failed to fetch colors');
  }
}
