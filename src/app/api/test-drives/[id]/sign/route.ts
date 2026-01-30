import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  successResponse,
  serverErrorResponse,
  badRequestResponse,
  notFoundResponse,
} from '@/lib/api/response';
import { generateTestDrivePDF } from '@/lib/pdf/test-drive-agreement';
import { sendTestDriveConfirmationEmail } from '@/lib/email/send';

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

    // Get client info for audit log
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Get the test drive
    const testDrive = await prisma.testDrive.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        salesExecutive: {
          select: { id: true, name: true, email: true },
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

    // Check that the vehicle slot is still available (not locked by someone else)
    if (testDrive.scheduledDate && testDrive.scheduledTime) {
      const conflictingLock = await prisma.testDrive.findFirst({
        where: {
          vehicleId: testDrive.vehicleId,
          id: { not: id },
          vehicleLockExpires: { gt: new Date() },
          status: { in: ['AGREEMENT_SIGNED', 'IN_PROGRESS'] },
          scheduledDate: testDrive.scheduledDate,
        },
      });

      if (conflictingLock) {
        return badRequestResponse('Vehicle is currently locked for another test drive. Please select a different time slot.');
      }
    }

    // Get active terms
    const activeTerms = await prisma.agreementTerms.findFirst({
      where: { isActive: true },
      orderBy: { effectiveAt: 'desc' },
    });

    // Use provided version or active terms version
    const finalTermsVersion = termsVersion || activeTerms?.version || '1.0';

    // Store signature data URL (in production, upload to blob storage)
    const signatureUrl = signatureData.startsWith('data:')
      ? `/api/signatures/${id}.png` // Mock URL - in production upload to blob storage
      : signatureData;

    // Generate agreement URL (PDF will be generated on demand)
    const agreementUrl = `/api/test-drives/${id}/agreement.pdf`;

    // Calculate vehicle lock expiration
    // Lock the vehicle for the duration of the test drive + 15 minutes buffer
    const now = new Date();
    const vehicleLockedAt = now;
    let vehicleLockExpires: Date | null = null;

    if (testDrive.scheduledDate && testDrive.scheduledTime) {
      const [hours, minutes] = testDrive.scheduledTime.split(':').map(Number);
      const scheduledDateTime = new Date(testDrive.scheduledDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      // Lock expires at end of scheduled slot + 15 min buffer
      vehicleLockExpires = new Date(scheduledDateTime);
      vehicleLockExpires.setMinutes(vehicleLockExpires.getMinutes() + (testDrive.duration || 30) + 15);
    }

    // Update test drive with signature and lock
    const updated = await prisma.testDrive.update({
      where: { id },
      data: {
        status: 'AGREEMENT_SIGNED',
        signatureUrl,
        agreementUrl,
        signedAt: now,
        termsVersion: finalTermsVersion,
        termsAccepted: true,
        vehicleLockedAt,
        vehicleLockExpires,
      },
      include: {
        customer: true,
        salesExecutive: {
          select: { id: true, name: true, email: true },
        },
        vehicle: true,
      },
    });

    // Create audit log entry for signing
    await prisma.testDriveAuditLog.create({
      data: {
        testDriveId: id,
        action: 'AGREEMENT_SIGNED',
        details: {
          termsVersion: finalTermsVersion,
          vehicleId: testDrive.vehicleId,
          scheduledDate: testDrive.scheduledDate?.toISOString(),
          scheduledTime: testDrive.scheduledTime,
          vehicleLockExpires: vehicleLockExpires?.toISOString(),
        },
        performedBy: null, // In real implementation, use authenticated user ID
        ipAddress,
        userAgent,
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

    // Try to send confirmation email (non-blocking)
    try {
      // Generate PDF for email attachment
      const pdfBuffer = await generateTestDrivePDF({
        testDrive: updated,
        customer: updated.customer,
        vehicle: updated.vehicle,
        salesExecutive: updated.salesExecutive,
        signatureData,
        termsVersion: finalTermsVersion,
      });

      if (updated.customer.email) {
        await sendTestDriveConfirmationEmail({
          to: updated.customer.email,
          customerName: updated.customer.name,
          vehicleInfo,
          scheduledDate: updated.scheduledDate,
          scheduledTime: updated.scheduledTime,
          salesExecutiveName: updated.salesExecutive.name,
          pdfAttachment: pdfBuffer,
        });

        // Update email sent status
        await prisma.testDrive.update({
          where: { id },
          data: {
            confirmationEmailSent: true,
            confirmationEmailSentAt: new Date(),
          },
        });

        // Log email sent
        await prisma.testDriveAuditLog.create({
          data: {
            testDriveId: id,
            action: 'CONFIRMATION_EMAIL_SENT',
            details: {
              email: updated.customer.email,
            },
            performedBy: null,
            ipAddress,
            userAgent,
          },
        });
      }
    } catch (emailError) {
      // Log error but don't fail the signing process
      console.error('Failed to send confirmation email:', emailError);
      await prisma.testDriveAuditLog.create({
        data: {
          testDriveId: id,
          action: 'CONFIRMATION_EMAIL_FAILED',
          details: {
            error: emailError instanceof Error ? emailError.message : 'Unknown error',
          },
          performedBy: null,
          ipAddress,
          userAgent,
        },
      });
    }

    return successResponse(updated);
  } catch (error) {
    console.error('Error signing test drive agreement:', error);
    return serverErrorResponse('Failed to sign agreement');
  }
}
