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

// POST /api/test-drives/:id/sign - Sign the test drive agreement
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { signatureData, termsVersion } = body;

    // Validate required fields
    if (!signatureData) {
      return badRequestResponse('signatureData is required');
    }

    // Get the test drive
    const testDrive = await prisma.testDrive.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        salesExecutive: {
          select: { id: true, name: true },
        },
      },
    });

    if (!testDrive) {
      return notFoundResponse('Test drive not found');
    }

    // Can only sign if status is VEHICLE_SELECTED
    if (testDrive.status !== 'VEHICLE_SELECTED') {
      return badRequestResponse('Can only sign agreement after vehicle and time are selected');
    }

    // Validate license is not expired
    if (testDrive.ocrLicenseExpiry && new Date(testDrive.ocrLicenseExpiry) < new Date()) {
      return badRequestResponse('Cannot sign agreement with expired driving license');
    }

    // Store signature data URL (in production, this would be uploaded to blob storage)
    // For now, we'll store it directly or generate a mock URL
    const signatureUrl = signatureData.startsWith('data:')
      ? `/api/signatures/${id}.png` // Mock URL - in production upload to blob storage
      : signatureData;

    // Generate agreement URL (in production, this would be a PDF)
    const agreementUrl = `/api/test-drives/${id}/agreement.pdf`;

    // Update test drive with signature
    const updated = await prisma.testDrive.update({
      where: { id },
      data: {
        status: 'AGREEMENT_SIGNED',
        signatureUrl,
        agreementUrl,
        signedAt: new Date(),
        termsVersion: termsVersion || '1.0',
      },
      include: {
        customer: true,
        salesExecutive: {
          select: { id: true, name: true, email: true },
        },
        vehicle: true,
      },
    });

    // Create notification for sales executive
    const vehicleInfo = `${updated.vehicle.year} ${updated.vehicle.make} ${updated.vehicle.model}`;
    await prisma.notification.create({
      data: {
        userId: updated.salesExecutiveId,
        type: 'TEST_DRIVE_SCHEDULED',
        title: 'Test Drive Ready',
        message: `${updated.customer.name} has signed the agreement for ${vehicleInfo}. Cleared for test drive.`,
        link: `/test-drive/${id}`,
        referenceId: id,
        referenceType: 'test-drive',
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Error signing test drive agreement:', error);
    return serverErrorResponse('Failed to sign agreement');
  }
}
