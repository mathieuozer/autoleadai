import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  successResponse,
  serverErrorResponse,
  badRequestResponse,
  notFoundResponse,
} from '@/lib/api/response';
import { PhotoType } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/trade-ins/:id/photos - Get all photos for an appraisal
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Check if appraisal exists
    const appraisal = await prisma.tradeInAppraisal.findUnique({
      where: { id },
    });

    if (!appraisal) {
      return notFoundResponse('Trade-in appraisal not found');
    }

    const photos = await prisma.tradeInPhoto.findMany({
      where: { appraisalId: id },
      orderBy: { createdAt: 'asc' },
    });

    return successResponse(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    return serverErrorResponse('Failed to fetch photos');
  }
}

// POST /api/trade-ins/:id/photos - Add a photo to an appraisal
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { type, url, thumbnail, notes } = body;

    // Validate required fields
    if (!type) {
      return badRequestResponse('Photo type is required');
    }

    if (!url) {
      return badRequestResponse('Photo URL is required');
    }

    // Validate photo type
    if (!Object.values(PhotoType).includes(type)) {
      return badRequestResponse(`Invalid photo type: ${type}`);
    }

    // Check if appraisal exists and is in draft status
    const appraisal = await prisma.tradeInAppraisal.findUnique({
      where: { id },
    });

    if (!appraisal) {
      return notFoundResponse('Trade-in appraisal not found');
    }

    if (appraisal.status !== 'DRAFT') {
      return badRequestResponse('Cannot add photos to a submitted appraisal');
    }

    // Check if photo of this type already exists
    const existingPhoto = await prisma.tradeInPhoto.findFirst({
      where: {
        appraisalId: id,
        type,
      },
    });

    if (existingPhoto) {
      // Update existing photo
      const updated = await prisma.tradeInPhoto.update({
        where: { id: existingPhoto.id },
        data: {
          url,
          thumbnail: thumbnail || null,
          notes: notes || null,
        },
      });
      return successResponse(updated);
    }

    // Create new photo
    const photo = await prisma.tradeInPhoto.create({
      data: {
        appraisalId: id,
        type,
        url,
        thumbnail: thumbnail || null,
        notes: notes || null,
      },
    });

    return successResponse(photo, undefined, 201);
  } catch (error) {
    console.error('Error adding photo:', error);
    return serverErrorResponse('Failed to add photo');
  }
}
