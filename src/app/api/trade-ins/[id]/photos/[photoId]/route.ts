import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  successResponse,
  serverErrorResponse,
  badRequestResponse,
  notFoundResponse,
} from '@/lib/api/response';

interface RouteContext {
  params: Promise<{ id: string; photoId: string }>;
}

// PATCH /api/trade-ins/:id/photos/:photoId - Update a photo (annotations, notes)
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id, photoId } = await context.params;
    const body = await request.json();

    // Check if appraisal exists and is in draft status
    const appraisal = await prisma.tradeInAppraisal.findUnique({
      where: { id },
    });

    if (!appraisal) {
      return notFoundResponse('Trade-in appraisal not found');
    }

    if (appraisal.status !== 'DRAFT') {
      return badRequestResponse('Cannot modify photos on a submitted appraisal');
    }

    // Check if photo exists
    const photo = await prisma.tradeInPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.appraisalId !== id) {
      return notFoundResponse('Photo not found');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    if (body.annotations !== undefined) {
      // Validate annotations structure
      if (!Array.isArray(body.annotations)) {
        return badRequestResponse('Annotations must be an array');
      }
      for (const annotation of body.annotations) {
        if (
          typeof annotation.x !== 'number' ||
          typeof annotation.y !== 'number' ||
          typeof annotation.type !== 'string' ||
          typeof annotation.text !== 'string'
        ) {
          return badRequestResponse('Invalid annotation structure');
        }
      }
      updateData.annotations = body.annotations;
    }

    if (body.url !== undefined) {
      updateData.url = body.url;
    }

    if (body.thumbnail !== undefined) {
      updateData.thumbnail = body.thumbnail;
    }

    const updated = await prisma.tradeInPhoto.update({
      where: { id: photoId },
      data: updateData,
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Error updating photo:', error);
    return serverErrorResponse('Failed to update photo');
  }
}

// DELETE /api/trade-ins/:id/photos/:photoId - Delete a photo
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id, photoId } = await context.params;

    // Check if appraisal exists and is in draft status
    const appraisal = await prisma.tradeInAppraisal.findUnique({
      where: { id },
    });

    if (!appraisal) {
      return notFoundResponse('Trade-in appraisal not found');
    }

    if (appraisal.status !== 'DRAFT') {
      return badRequestResponse('Cannot delete photos from a submitted appraisal');
    }

    // Check if photo exists
    const photo = await prisma.tradeInPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.appraisalId !== id) {
      return notFoundResponse('Photo not found');
    }

    await prisma.tradeInPhoto.delete({
      where: { id: photoId },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return serverErrorResponse('Failed to delete photo');
  }
}
