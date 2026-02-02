import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, notFoundResponse } from '@/lib/api/response';

interface RouteContext {
  params: Promise<{ brandId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { brandId } = await context.params;

    // Verify brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return notFoundResponse('Brand not found');
    }

    const models = await prisma.vehicleModel.findMany({
      where: { brandId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            variants: true,
          },
        },
        variants: {
          select: {
            year: true,
          },
          distinct: ['year'],
        },
      },
    });

    // Transform to include variant count and available years
    const transformedModels = models.map(model => ({
      id: model.id,
      name: model.name,
      code: model.code,
      brandId: model.brandId,
      variantCount: model._count.variants,
      availableYears: [...new Set(model.variants.map(v => v.year))].sort((a, b) => b - a),
    }));

    return successResponse(transformedModels);
  } catch (error) {
    console.error('Error fetching models:', error);
    return serverErrorResponse('Failed to fetch models');
  }
}
