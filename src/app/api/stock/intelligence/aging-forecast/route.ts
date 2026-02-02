import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse } from '@/lib/api/response';
import { calculateAgingScore, AGING_THRESHOLDS } from '@/lib/stock-scoring';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const brandId = searchParams.get('brandId');
    const modelId = searchParams.get('modelId');
    const riskLevel = searchParams.get('riskLevel');

    // Build where clause
    const where: Record<string, unknown> = {
      status: { in: ['IN_TRANSIT', 'IN_YARD'] },
    };

    if (brandId) {
      where.variant = {
        model: {
          brandId,
        },
      };
    }

    if (modelId) {
      where.variant = {
        ...(where.variant as Record<string, unknown>),
        modelId,
      };
    }

    // Get inventory
    const inventory = await prisma.vehicleInventory.findMany({
      where,
      include: {
        variant: {
          include: {
            model: {
              include: { brand: true },
            },
          },
        },
        exteriorColor: true,
      },
      orderBy: { stockDate: 'asc' }, // Oldest first
    });

    // Calculate aging scores
    const now = new Date();
    const scoredInventory = inventory.map(item => {
      const agingScore = calculateAgingScore(item.stockDate, now);
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
        agingScore: agingScore.score,
        riskLevel: agingScore.riskLevel,
        riskFactors: agingScore.factors,
        estimatedValueLoss: calculateValueLoss(
          Number(item.variant?.currentPrice || 0),
          agingScore.daysInStock
        ),
        price: item.variant?.currentPrice ? Number(item.variant.currentPrice) : 0,
      };
    });

    // Filter by risk level if specified
    let filteredInventory = scoredInventory;
    if (riskLevel) {
      filteredInventory = scoredInventory.filter(
        item => item.riskLevel === riskLevel.toUpperCase()
      );
    }

    // Sort by aging score descending
    filteredInventory.sort((a, b) => b.agingScore - a.agingScore);

    // Forecast summary
    const forecast = {
      next7Days: {
        willReachAging: scoredInventory.filter(i => {
          const daysToAging = AGING_THRESHOLDS.AGING - i.daysInStock;
          return daysToAging > 0 && daysToAging <= 7;
        }).length,
        willReachCritical: scoredInventory.filter(i => {
          const daysToCritical = AGING_THRESHOLDS.STALE - i.daysInStock;
          return daysToCritical > 0 && daysToCritical <= 7;
        }).length,
      },
      next30Days: {
        willReachAging: scoredInventory.filter(i => {
          const daysToAging = AGING_THRESHOLDS.AGING - i.daysInStock;
          return daysToAging > 0 && daysToAging <= 30;
        }).length,
        willReachCritical: scoredInventory.filter(i => {
          const daysToCritical = AGING_THRESHOLDS.STALE - i.daysInStock;
          return daysToCritical > 0 && daysToCritical <= 30;
        }).length,
      },
    };

    // Risk distribution
    const riskDistribution = {
      low: scoredInventory.filter(i => i.riskLevel === 'LOW').length,
      medium: scoredInventory.filter(i => i.riskLevel === 'MEDIUM').length,
      high: scoredInventory.filter(i => i.riskLevel === 'HIGH').length,
      critical: scoredInventory.filter(i => i.riskLevel === 'CRITICAL').length,
    };

    return successResponse({
      inventory: filteredInventory,
      forecast,
      riskDistribution,
      thresholds: {
        fresh: `0-${AGING_THRESHOLDS.FRESH} days`,
        aging: `${AGING_THRESHOLDS.FRESH + 1}-${AGING_THRESHOLDS.AGING} days`,
        stale: `${AGING_THRESHOLDS.AGING + 1}-${AGING_THRESHOLDS.STALE} days`,
        critical: `${AGING_THRESHOLDS.STALE + 1}+ days`,
      },
      total: filteredInventory.length,
    });
  } catch (error) {
    console.error('Error fetching aging forecast:', error);
    return serverErrorResponse('Failed to fetch aging forecast');
  }
}

function calculateValueLoss(price: number, daysInStock: number): number {
  // Estimate 0.1% value loss per day after 30 days
  if (daysInStock <= AGING_THRESHOLDS.FRESH) return 0;

  const daysOverFresh = daysInStock - AGING_THRESHOLDS.FRESH;
  const lossRate = 0.001; // 0.1% per day
  return Math.round(price * daysOverFresh * lossRate);
}
