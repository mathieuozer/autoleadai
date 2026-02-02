import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse } from '@/lib/api/response';
import { calculateDemandSupplyMismatch } from '@/lib/color-recommendation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const variantId = searchParams.get('variantId');
    const brandId = searchParams.get('brandId');

    // Build where clause for demand analysis
    const demandWhere: Record<string, unknown> = {};
    if (variantId) {
      demandWhere.variantId = variantId;
    }

    // Get demand analysis data
    const demandAnalysis = await prisma.colorDemandAnalysis.findMany({
      where: demandWhere,
      orderBy: { month: 'desc' },
      take: 100, // Last 100 entries
    });

    // Get current inventory levels
    const inventoryWhere: Record<string, unknown> = {
      status: { in: ['IN_TRANSIT', 'IN_YARD'] },
    };
    if (variantId) {
      inventoryWhere.variantId = variantId;
    }
    if (brandId) {
      inventoryWhere.variant = {
        model: {
          brandId,
        },
      };
    }

    const inventory = await prisma.vehicleInventory.groupBy({
      by: ['variantId', 'exteriorColorId'],
      where: inventoryWhere,
      _count: { id: true },
    });

    // Get variants for context
    const variantIds = [...new Set(inventory.map(i => i.variantId))];
    const variants = await prisma.vehicleVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        model: {
          include: { brand: true },
        },
      },
    });
    const variantMap = new Map(variants.map(v => [v.id, v]));

    // Get colors for context
    const colorIds = [...new Set(inventory.map(i => i.exteriorColorId))];
    const colors = await prisma.vehicleColor.findMany({
      where: { id: { in: colorIds } },
    });
    const colorMap = new Map(colors.map(c => [c.id, c]));

    // Build demand-supply matrix
    const matrix: Array<{
      variantId: string;
      colorId: string;
      vehicle: string;
      color: string;
      stockCount: number;
      demandScore: number;
      supplyScore: number;
      mismatch: ReturnType<typeof calculateDemandSupplyMismatch>;
    }> = [];

    inventory.forEach(inv => {
      const variant = variantMap.get(inv.variantId);
      const color = colorMap.get(inv.exteriorColorId);
      const demand = demandAnalysis.find(
        d => d.variantId === inv.variantId && d.exteriorColorId === inv.exteriorColorId
      );

      const demandScore = demand?.demandScore || 50;
      const supplyScore = demand?.supplyScore || 50;
      const mismatch = calculateDemandSupplyMismatch(demandScore, supplyScore);

      matrix.push({
        variantId: inv.variantId,
        colorId: inv.exteriorColorId,
        vehicle: variant
          ? `${variant.model.brand.name} ${variant.model.name} ${variant.name} ${variant.year}`
          : 'Unknown',
        color: color?.name || 'Unknown',
        stockCount: inv._count.id,
        demandScore,
        supplyScore,
        mismatch,
      });
    });

    // Sort by mismatch score descending (biggest mismatches first)
    matrix.sort((a, b) => b.mismatch.mismatchScore - a.mismatch.mismatchScore);

    // Summary statistics
    const undersupplied = matrix.filter(m => m.mismatch.status === 'UNDERSUPPLIED');
    const oversupplied = matrix.filter(m => m.mismatch.status === 'OVERSUPPLIED');
    const balanced = matrix.filter(m => m.mismatch.status === 'BALANCED');

    const summary = {
      totalCombinations: matrix.length,
      undersupplied: {
        count: undersupplied.length,
        items: undersupplied.slice(0, 5).map(m => ({
          vehicle: m.vehicle,
          color: m.color,
          gap: m.demandScore - m.supplyScore,
        })),
      },
      oversupplied: {
        count: oversupplied.length,
        items: oversupplied.slice(0, 5).map(m => ({
          vehicle: m.vehicle,
          color: m.color,
          excess: m.supplyScore - m.demandScore,
        })),
      },
      balanced: {
        count: balanced.length,
      },
    };

    // Recommendations
    const recommendations = [];

    if (undersupplied.length > 0) {
      recommendations.push({
        type: 'UNDERSUPPLY',
        priority: 'HIGH',
        message: `${undersupplied.length} vehicle-color combinations are undersupplied`,
        action: 'Consider ordering more units or expediting in-transit deliveries',
        items: undersupplied.slice(0, 3).map(m => m.vehicle + ' - ' + m.color),
      });
    }

    if (oversupplied.length > 0) {
      recommendations.push({
        type: 'OVERSUPPLY',
        priority: oversupplied.length > 5 ? 'HIGH' : 'MEDIUM',
        message: `${oversupplied.length} vehicle-color combinations are oversupplied`,
        action: 'Consider promotional offers or reallocating to other branches',
        items: oversupplied.slice(0, 3).map(m => m.vehicle + ' - ' + m.color),
      });
    }

    return successResponse({
      matrix,
      summary,
      recommendations,
      filters: {
        variantId,
        brandId,
      },
    });
  } catch (error) {
    console.error('Error fetching demand-supply analysis:', error);
    return serverErrorResponse('Failed to fetch demand-supply analysis');
  }
}
