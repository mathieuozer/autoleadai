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

    const { inspectorId, tentativePrice, notes } = body;

    // Validate required fields
    if (!inspectorId) {
      return badRequestResponse('Inspector ID is required');
    }

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

    // Check if appraisal is in valid state for review
    if (appraisal.status !== 'SUBMITTED' && appraisal.status !== 'UNDER_REVIEW') {
      return badRequestResponse(`Cannot review appraisal with status: ${appraisal.status}`);
    }

    // Verify inspector exists
    const inspector = await prisma.user.findUnique({
      where: { id: inspectorId },
    });

    if (!inspector) {
      return badRequestResponse('Inspector not found');
    }

    // Update appraisal with review
    const reviewed = await prisma.tradeInAppraisal.update({
      where: { id },
      data: {
        status: 'PRICED',
        inspectorId,
        reviewedAt: new Date(),
        tentativePrice,
        inspectorNotes: notes || null,
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

    return successResponse(transformedAppraisal);
  } catch (error) {
    console.error('Error submitting review:', error);
    return serverErrorResponse('Failed to submit review');
  }
}
