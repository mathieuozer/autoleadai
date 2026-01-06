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

// POST /api/test-drives/:id/complete - Mark test drive as complete
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { notes, outcome } = body; // outcome: 'interested', 'not_interested', 'follow_up'

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

    // Can only complete if status is AGREEMENT_SIGNED or IN_PROGRESS
    if (!['AGREEMENT_SIGNED', 'IN_PROGRESS'].includes(testDrive.status)) {
      return badRequestResponse('Can only complete test drives that are signed or in progress');
    }

    // Update test drive
    const updated = await prisma.testDrive.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes: notes
          ? testDrive.notes
            ? `${testDrive.notes}\n\n[Completion Notes] ${notes}${outcome ? ` (Outcome: ${outcome})` : ''}`
            : `[Completion Notes] ${notes}${outcome ? ` (Outcome: ${outcome})` : ''}`
          : testDrive.notes,
      },
      include: {
        customer: true,
        salesExecutive: {
          select: { id: true, name: true, email: true },
        },
        vehicle: true,
      },
    });

    // Create notification
    const vehicleInfo = `${updated.vehicle.year} ${updated.vehicle.make} ${updated.vehicle.model}`;
    await prisma.notification.create({
      data: {
        userId: updated.salesExecutiveId,
        type: 'TEST_DRIVE_COMPLETED',
        title: 'Test Drive Completed',
        message: `Test drive completed for ${updated.customer.name} - ${vehicleInfo}`,
        link: `/test-drive/${id}`,
        referenceId: id,
        referenceType: 'test-drive',
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Error completing test drive:', error);
    return serverErrorResponse('Failed to complete test drive');
  }
}
