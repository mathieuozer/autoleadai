import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, notFoundResponse } from '@/lib/api/response';

interface RouteContext {
  params: Promise<{ modelId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { modelId } = await context.params;

    // Verify model exists
    const model = await prisma.vehicleModel.findUnique({
      where: { id: modelId },
      include: { brand: true },
    });

    if (!model) {
      return notFoundResponse('Model not found');
    }

    // Get distinct years with variant and inventory counts
    const variants = await prisma.vehicleVariant.findMany({
      where: { modelId },
      select: {
        year: true,
        _count: {
          select: {
            inventory: {
              where: {
                status: { in: ['IN_TRANSIT', 'IN_YARD'] },
              },
            },
          },
        },
      },
    });

    // Aggregate by year
    const yearMap = new Map<number, { variantCount: number; stockCount: number }>();

    variants.forEach(variant => {
      const existing = yearMap.get(variant.year) || { variantCount: 0, stockCount: 0 };
      yearMap.set(variant.year, {
        variantCount: existing.variantCount + 1,
        stockCount: existing.stockCount + variant._count.inventory,
      });
    });

    const years = Array.from(yearMap.entries())
      .map(([year, counts]) => ({
        year,
        variantCount: counts.variantCount,
        stockCount: counts.stockCount,
      }))
      .sort((a, b) => b.year - a.year);

    return successResponse({
      model: {
        id: model.id,
        name: model.name,
        brand: model.brand.name,
      },
      years,
    });
  } catch (error) {
    console.error('Error fetching years:', error);
    return serverErrorResponse('Failed to fetch years');
  }
}
