import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  successResponse,
  serverErrorResponse,
  badRequestResponse,
  notFoundResponse,
} from '@/lib/api/response';
import { REQUIRED_PHOTO_COUNT } from '@/lib/trade-in-constants';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/trade-ins/:id/submit - Submit appraisal for review
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Get appraisal with photos
    const appraisal = await prisma.tradeInAppraisal.findUnique({
      where: { id },
      include: {
        photos: true,
      },
    });

    if (!appraisal) {
      return notFoundResponse('Trade-in appraisal not found');
    }

    // Check if already submitted
    if (appraisal.status !== 'DRAFT') {
      return badRequestResponse('Appraisal has already been submitted');
    }

    // Validate required fields
    const validationErrors: string[] = [];

    // Step 1: Registration cards
    if (!appraisal.registrationFrontUrl) {
      validationErrors.push('Registration card front image is required');
    }

    // Step 2: Vehicle details
    if (!appraisal.mileage) {
      validationErrors.push('Mileage is required');
    }
    if (!appraisal.expectedPrice) {
      validationErrors.push('Expected price is required');
    }
    if (!appraisal.condition) {
      validationErrors.push('Vehicle condition is required');
    }

    // Step 3: Photos - check required photo count
    const requiredPhotoTypes = [
      'FRONT_VIEW',
      'REAR_VIEW',
      'LEFT_SIDE',
      'RIGHT_SIDE',
      'DASHBOARD',
      'FRONT_SEATS',
      'REAR_SEATS',
      'TRUNK',
    ];

    const uploadedPhotoTypes = new Set(appraisal.photos.map((p) => p.type));
    const missingPhotos = requiredPhotoTypes.filter((type) => !uploadedPhotoTypes.has(type as never));

    if (missingPhotos.length > 0) {
      validationErrors.push(
        `Missing required photos: ${missingPhotos.map((t) => t.replace('_', ' ').toLowerCase()).join(', ')}`
      );
    }

    if (validationErrors.length > 0) {
      return badRequestResponse('Validation failed', { errors: validationErrors });
    }

    // Submit the appraisal
    const submitted = await prisma.tradeInAppraisal.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
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
        photos: true,
      },
    });

    // Transform decimal fields
    const transformedAppraisal = {
      ...submitted,
      expectedPrice: submitted.expectedPrice ? Number(submitted.expectedPrice) : null,
      tentativePrice: submitted.tentativePrice ? Number(submitted.tentativePrice) : null,
    };

    return successResponse(transformedAppraisal);
  } catch (error) {
    console.error('Error submitting trade-in appraisal:', error);
    return serverErrorResponse('Failed to submit trade-in appraisal');
  }
}
