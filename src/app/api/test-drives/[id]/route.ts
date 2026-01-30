import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  successResponse,
  serverErrorResponse,
  badRequestResponse,
  notFoundResponse,
} from '@/lib/api/response';
import { TestDriveStatus } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/test-drives/:id - Get test drive details
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const testDrive = await prisma.testDrive.findUnique({
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
        vehicle: true,
      },
    });

    if (!testDrive) {
      return notFoundResponse('Test drive not found');
    }

    return successResponse(testDrive);
  } catch (error) {
    console.error('Error fetching test drive:', error);
    return serverErrorResponse('Failed to fetch test drive');
  }
}

// PATCH /api/test-drives/:id - Update test drive
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Check if test drive exists
    const existing = await prisma.testDrive.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse('Test drive not found');
    }

    // Don't allow updates to completed/cancelled test drives
    if (['COMPLETED', 'CANCELLED'].includes(existing.status)) {
      return badRequestResponse('Cannot update a completed or cancelled test drive');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Status update
    if (body.status !== undefined) {
      if (!Object.values(TestDriveStatus).includes(body.status)) {
        return badRequestResponse(`Invalid status: ${body.status}`);
      }
      updateData.status = body.status;
    }

    // Identity Documents
    if (body.drivingLicenseFrontUrl !== undefined) {
      updateData.drivingLicenseFrontUrl = body.drivingLicenseFrontUrl;
    }
    if (body.drivingLicenseBackUrl !== undefined) {
      updateData.drivingLicenseBackUrl = body.drivingLicenseBackUrl;
    }
    if (body.nationalIdFrontUrl !== undefined) {
      updateData.nationalIdFrontUrl = body.nationalIdFrontUrl;
    }
    if (body.nationalIdBackUrl !== undefined) {
      updateData.nationalIdBackUrl = body.nationalIdBackUrl;
    }

    // OCR data - Driving License
    if (body.ocrFullName !== undefined) updateData.ocrFullName = body.ocrFullName;
    if (body.ocrLicenseNumber !== undefined) updateData.ocrLicenseNumber = body.ocrLicenseNumber;
    if (body.ocrLicenseExpiry !== undefined) {
      updateData.ocrLicenseExpiry = body.ocrLicenseExpiry ? new Date(body.ocrLicenseExpiry) : null;
    }
    if (body.ocrDateOfBirth !== undefined) {
      updateData.ocrDateOfBirth = body.ocrDateOfBirth ? new Date(body.ocrDateOfBirth) : null;
    }
    if (body.ocrNationality !== undefined) updateData.ocrNationality = body.ocrNationality;
    if (body.ocrLicenseCategory !== undefined) updateData.ocrLicenseCategory = body.ocrLicenseCategory;

    // OCR data - National ID (Emirates ID)
    if (body.ocrEmiratesIdNumber !== undefined) updateData.ocrEmiratesIdNumber = body.ocrEmiratesIdNumber;
    if (body.ocrNationalIdExpiry !== undefined) {
      updateData.ocrNationalIdExpiry = body.ocrNationalIdExpiry ? new Date(body.ocrNationalIdExpiry) : null;
    }
    if (body.ocrNationalIdNameEn !== undefined) updateData.ocrNationalIdNameEn = body.ocrNationalIdNameEn;
    if (body.ocrNationalIdNameAr !== undefined) updateData.ocrNationalIdNameAr = body.ocrNationalIdNameAr;

    // Booking details
    if (body.scheduledDate !== undefined) {
      updateData.scheduledDate = body.scheduledDate ? new Date(body.scheduledDate) : null;
    }
    if (body.scheduledTime !== undefined) {
      updateData.scheduledTime = body.scheduledTime;
    }
    if (body.duration !== undefined) {
      updateData.duration = parseInt(body.duration);
    }

    // Vehicle change (only allowed before agreement signed)
    if (body.vehicleId !== undefined) {
      if (['AGREEMENT_SIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(existing.status)) {
        return badRequestResponse('Cannot change vehicle after agreement is signed');
      }
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: body.vehicleId },
      });
      if (!vehicle) {
        return badRequestResponse('Vehicle not found');
      }
      if (!vehicle.testDriveAvailable) {
        return badRequestResponse('Vehicle is not available for test drives');
      }
      updateData.vehicleId = body.vehicleId;
    }

    // Notes
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    // Update test drive
    const updated = await prisma.testDrive.update({
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
        vehicle: true,
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Error updating test drive:', error);
    return serverErrorResponse('Failed to update test drive');
  }
}
