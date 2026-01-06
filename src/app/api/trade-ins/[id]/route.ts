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

    // OCR data (UAE Mulkiyah fields)
    if (body.ocrCustomerName !== undefined) updateData.ocrCustomerName = body.ocrCustomerName;
    if (body.ocrTrafficFileNumber !== undefined) updateData.ocrTrafficFileNumber = body.ocrTrafficFileNumber;
    if (body.ocrPlateNumber !== undefined) updateData.ocrPlateNumber = body.ocrPlateNumber;
    if (body.ocrEmirateCode !== undefined) updateData.ocrEmirateCode = body.ocrEmirateCode;
    if (body.ocrVin !== undefined) updateData.ocrVin = body.ocrVin;
    if (body.ocrVehicleMake !== undefined) updateData.ocrVehicleMake = body.ocrVehicleMake;
    if (body.ocrVehicleModel !== undefined) updateData.ocrVehicleModel = body.ocrVehicleModel;
    if (body.ocrVehicleTrim !== undefined) updateData.ocrVehicleTrim = body.ocrVehicleTrim;
    if (body.ocrVehicleColor !== undefined) updateData.ocrVehicleColor = body.ocrVehicleColor;
    if (body.ocrVehicleType !== undefined) updateData.ocrVehicleType = body.ocrVehicleType;
    if (body.ocrEngineNumber !== undefined) updateData.ocrEngineNumber = body.ocrEngineNumber;
    if (body.ocrRegistrationYear !== undefined) {
      updateData.ocrRegistrationYear = body.ocrRegistrationYear ? parseInt(body.ocrRegistrationYear) : null;
    }
    if (body.ocrRegistrationDate !== undefined) {
      // Handle date strings - only set if valid
      if (body.ocrRegistrationDate) {
        const date = new Date(body.ocrRegistrationDate);
        updateData.ocrRegistrationDate = isNaN(date.getTime()) ? null : date;
      } else {
        updateData.ocrRegistrationDate = null;
      }
    }
    if (body.ocrExpiryDate !== undefined) {
      if (body.ocrExpiryDate) {
        const date = new Date(body.ocrExpiryDate);
        updateData.ocrExpiryDate = isNaN(date.getTime()) ? null : date;
      } else {
        updateData.ocrExpiryDate = null;
      }
    }
    if (body.ocrInsuranceCompany !== undefined) updateData.ocrInsuranceCompany = body.ocrInsuranceCompany;
    if (body.ocrInsuranceExpiry !== undefined) {
      if (body.ocrInsuranceExpiry) {
        const date = new Date(body.ocrInsuranceExpiry);
        updateData.ocrInsuranceExpiry = isNaN(date.getTime()) ? null : date;
      } else {
        updateData.ocrInsuranceExpiry = null;
      }
    }
    if (body.ocrMortgageInfo !== undefined) updateData.ocrMortgageInfo = body.ocrMortgageInfo;

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
