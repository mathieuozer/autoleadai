import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  successResponse,
  serverErrorResponse,
  badRequestResponse,
  notFoundResponse,
} from '@/lib/api/response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/trade-ins/:id/review - Submit inspector review with tentative price
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { inspectorId, tentativePrice, inspectorNotes } = body;

    if (tentativePrice === undefined || tentativePrice === null) {
      return badRequestResponse('Tentative price is required');
    }

    if (typeof tentativePrice !== 'number' || tentativePrice < 0) {
      return badRequestResponse('Tentative price must be a positive number');
    }

    // Check if appraisal exists
    const appraisal = await prisma.tradeInAppraisal.findUnique({
      where: { id },
    });

    if (!appraisal) {
      return notFoundResponse('Trade-in appraisal not found');
    }

    // Get default inspector if not provided (first user for demo)
    let reviewerId = inspectorId;
    if (!reviewerId) {
      const defaultInspector = await prisma.user.findFirst();
      reviewerId = defaultInspector?.id;
    }

    // Update appraisal with review
    const reviewed = await prisma.tradeInAppraisal.update({
      where: { id },
      data: {
        status: 'PRICED',
        inspectorId: reviewerId,
        reviewedAt: new Date(),
        tentativePrice,
        inspectorNotes: inspectorNotes || null,
      },
      include: {
        customer: true,
        salesExecutive: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        inspector: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        photos: true,
      },
    });

    // Transform decimal fields
    const transformedAppraisal = {
      ...reviewed,
      expectedPrice: reviewed.expectedPrice ? Number(reviewed.expectedPrice) : null,
      tentativePrice: reviewed.tentativePrice ? Number(reviewed.tentativePrice) : null,
    };

    // Create notification for sales executive
    const vehicleInfo = [
      reviewed.ocrRegistrationYear,
      reviewed.ocrVehicleMake,
      reviewed.ocrVehicleModel,
    ].filter(Boolean).join(' ') || 'Vehicle';

    await prisma.notification.create({
      data: {
        userId: reviewed.salesExecutiveId,
        type: 'TRADE_IN_PRICED',
        title: 'Trade-In Priced',
        message: `${vehicleInfo} has been valued at AED ${tentativePrice.toLocaleString()}`,
        link: `/trade-in/${id}`,
        referenceId: id,
        referenceType: 'trade-in',
      },
    });

    return successResponse(transformedAppraisal);
  } catch (error) {
    console.error('Error submitting review:', error);
    return serverErrorResponse('Failed to submit review');
  }
}
