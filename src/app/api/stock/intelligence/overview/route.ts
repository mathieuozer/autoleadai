import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse } from '@/lib/api/response';
import { calculateStockHealth, AGING_THRESHOLDS } from '@/lib/stock-scoring';

export async function GET() {
  try {
    // Get all inventory with status IN_TRANSIT or IN_YARD
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
          },
        },
        exteriorColor: true,
      },
    });

    // Calculate stock health
    const stockHealth = calculateStockHealth(
      inventory.map(i => ({ stockDate: i.stockDate }))
    );

    // Count by status
    const statusCounts = {
      inTransit: inventory.filter(i => i.status === 'IN_TRANSIT').length,
      inYard: inventory.filter(i => i.status === 'IN_YARD').length,
      reserved: await prisma.vehicleInventory.count({ where: { status: 'RESERVED' } }),
      sold: await prisma.vehicleInventory.count({ where: { status: 'SOLD' } }),
    };

    // Calculate total value
    const inventoryWithPrices = inventory.filter(i => i.variant?.currentPrice);
    const totalValue = inventoryWithPrices.reduce(
      (sum, i) => sum + Number(i.variant.currentPrice),
      0
    );

    // Aging buckets
    const now = new Date();
    const agingBuckets = {
      fresh: inventory.filter(i => {
        const days = Math.floor((now.getTime() - i.stockDate.getTime()) / (1000 * 60 * 60 * 24));
        return days <= AGING_THRESHOLDS.FRESH;
      }).length,
      aging: inventory.filter(i => {
        const days = Math.floor((now.getTime() - i.stockDate.getTime()) / (1000 * 60 * 60 * 24));
        return days > AGING_THRESHOLDS.FRESH && days <= AGING_THRESHOLDS.AGING;
      }).length,
      stale: inventory.filter(i => {
        const days = Math.floor((now.getTime() - i.stockDate.getTime()) / (1000 * 60 * 60 * 24));
        return days > AGING_THRESHOLDS.AGING && days <= AGING_THRESHOLDS.STALE;
      }).length,
      critical: inventory.filter(i => {
        const days = Math.floor((now.getTime() - i.stockDate.getTime()) / (1000 * 60 * 60 * 24));
        return days > AGING_THRESHOLDS.STALE;
      }).length,
    };

    // Top brands by inventory
    const brandCounts = inventory.reduce((acc, i) => {
      const brand = i.variant?.model?.brand?.name || 'Unknown';
      acc[brand] = (acc[brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topBrands = Object.entries(brandCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // At-risk stock value (over 60 days)
    const atRiskInventory = inventory.filter(i => {
      const days = Math.floor((now.getTime() - i.stockDate.getTime()) / (1000 * 60 * 60 * 24));
      return days > AGING_THRESHOLDS.AGING;
    });
    const atRiskValue = atRiskInventory.reduce(
      (sum, i) => sum + (i.variant?.currentPrice ? Number(i.variant.currentPrice) : 0),
      0
    );

    return successResponse({
      health: stockHealth,
      counts: {
        total: inventory.length,
        ...statusCounts,
      },
      value: {
        total: totalValue,
        atRisk: atRiskValue,
        atRiskPercentage: totalValue > 0 ? Math.round((atRiskValue / totalValue) * 100) : 0,
        currency: 'AED',
      },
      aging: agingBuckets,
      topBrands,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching stock intelligence overview:', error);
    return serverErrorResponse('Failed to fetch stock intelligence overview');
  }
}
