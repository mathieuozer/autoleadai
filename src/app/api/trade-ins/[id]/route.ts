import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  successResponse,
  serverErrorResponse,
  badRequestResponse,
  notFoundResponse,
} from '@/lib/api/response';
import { VehicleCondition } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/trade-ins/:id - Get trade-in appraisal details
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const appraisal = await prisma.tradeInAppraisal.findUnique({
      where: { id },
      include: {
        customer: true,
        salesExecutive: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        inspector: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        photos: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!appraisal) {
      return notFoundResponse('Trade-in appraisal not found');
    }

    // Transform decimal fields
    const transformedAppraisal = {
      ...appraisal,
      expectedPrice: appraisal.expectedPrice ? Number(appraisal.expectedPrice) : null,
      tentativePrice: appraisal.tentativePrice ? Number(appraisal.tentativePrice) : null,
    };

    return successResponse(transformedAppraisal);
  } catch (error) {
    console.error('Error fetching trade-in appraisal:', error);
    return serverErrorResponse('Failed to fetch trade-in appraisal');
  }
}

// PATCH /api/trade-ins/:id - Update trade-in appraisal
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Check if appraisal exists and is still a draft
    const existing = await prisma.tradeInAppraisal.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse('Trade-in appraisal not found');
    }

    // Only allow updates to DRAFT appraisals
    if (existing.status !== 'DRAFT') {
      return badRequestResponse('Cannot update a submitted appraisal');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Step 1: Registration card URLs
    if (body.registrationFrontUrl !== undefined) {
      updateData.registrationFrontUrl = body.registrationFrontUrl;
    }
    if (body.registrationBackUrl !== undefined) {
      updateData.registrationBackUrl = body.registrationBackUrl;
    }

    // OCR data
    if (body.ocrCustomerName !== undefined) updateData.ocrCustomerName = body.ocrCustomerName;
    if (body.ocrVehicleMake !== undefined) updateData.ocrVehicleMake = body.ocrVehicleMake;
    if (body.ocrVehicleModel !== undefined) updateData.ocrVehicleModel = body.ocrVehicleModel;
    if (body.ocrVehicleTrim !== undefined) updateData.ocrVehicleTrim = body.ocrVehicleTrim;
    if (body.ocrVin !== undefined) updateData.ocrVin = body.ocrVin;
    if (body.ocrPlateNumber !== undefined) updateData.ocrPlateNumber = body.ocrPlateNumber;
    if (body.ocrRegistrationYear !== undefined) {
      updateData.ocrRegistrationYear = body.ocrRegistrationYear ? parseInt(body.ocrRegistrationYear) : null;
    }

    // Step 2: Vehicle details
    if (body.mileage !== undefined) {
      updateData.mileage = body.mileage ? parseInt(body.mileage) : null;
    }
    if (body.expectedPrice !== undefined) {
      updateData.expectedPrice = body.expectedPrice ? parseFloat(body.expectedPrice) : null;
    }
    if (body.condition !== undefined) {
      if (body.condition && !Object.values(VehicleCondition).includes(body.condition.toUpperCase())) {
        return badRequestResponse(`Invalid condition: ${body.condition}`);
      }
      updateData.condition = body.condition ? body.condition.toUpperCase() : null;
    }
    if (body.features !== undefined) {
      if (!Array.isArray(body.features)) {
        return badRequestResponse('features must be an array');
      }
      updateData.features = body.features;
    }
    if (body.additionalNotes !== undefined) {
      updateData.additionalNotes = body.additionalNotes;
    }

    // Update appraisal
    const updated = await prisma.tradeInAppraisal.update({
      where: { id },
      data: updateData,
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
      ...updated,
      expectedPrice: updated.expectedPrice ? Number(updated.expectedPrice) : null,
      tentativePrice: updated.tentativePrice ? Number(updated.tentativePrice) : null,
    };

    return successResponse(transformedAppraisal);
  } catch (error) {
    console.error('Error updating trade-in appraisal:', error);
    return serverErrorResponse('Failed to update trade-in appraisal');
  }
}
