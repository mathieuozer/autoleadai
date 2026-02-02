import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, notFoundResponse, badRequestResponse } from '@/lib/api/response';

interface RouteContext {
  params: Promise<{ modelId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { modelId } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');

    if (!year) {
      return badRequestResponse('Year parameter is required');
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum)) {
      return badRequestResponse('Invalid year parameter');
    }

    // Verify model exists
    const model = await prisma.vehicleModel.findUnique({
      where: { id: modelId },
      include: { brand: true },
    });

    if (!model) {
      return notFoundResponse('Model not found');
    }

    // Get variants for the specified year
    const variants = await prisma.vehicleVariant.findMany({
      where: {
        modelId,
        year: yearNum,
      },
      orderBy: { currentPrice: 'asc' },
      include: {
        _count: {
          select: {
            inventory: {
              where: {
                status: { in: ['IN_TRANSIT', 'IN_YARD'] },
              },
            },
          },
        },
        campaigns: {
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                type: true,
                discountType: true,
                discountValue: true,
                status: true,
                endDate: true,
              },
            },
          },
          where: {
            campaign: {
              status: 'ACTIVE',
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
          },
        },
      },
    });

    const transformedVariants = variants.map(variant => ({
      id: variant.id,
      name: variant.name,
      code: variant.code,
      year: variant.year,
      msrp: Number(variant.msrp),
      currentPrice: Number(variant.currentPrice),
      engineType: variant.engineType,
      transmission: variant.transmission,
      stockCount: variant._count.inventory,
      activeCampaigns: variant.campaigns.map(cv => ({
        id: cv.campaign.id,
        name: cv.campaign.name,
        type: cv.campaign.type,
        discountType: cv.campaign.discountType,
        discountValue: cv.overrideDiscount
          ? Number(cv.overrideDiscount)
          : cv.campaign.discountValue
            ? Number(cv.campaign.discountValue)
            : null,
        endsAt: cv.campaign.endDate,
      })),
    }));

    return successResponse({
      model: {
        id: model.id,
        name: model.name,
        brand: model.brand.name,
        brandCode: model.brand.code,
      },
      year: yearNum,
      variants: transformedVariants,
    });
  } catch (error) {
    console.error('Error fetching variants:', error);
    return serverErrorResponse('Failed to fetch variants');
  }
}
