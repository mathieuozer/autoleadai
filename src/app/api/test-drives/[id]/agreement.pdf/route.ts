import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateTestDrivePDF } from '@/lib/pdf/test-drive-agreement';
import { downloadDocument, uploadAgreementPDF, getDocumentUrl } from '@/lib/storage/blob';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/test-drives/:id/agreement.pdf - Get or generate the agreement PDF
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Get the test drive with all related data
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
      return NextResponse.json(
        { error: 'Test drive not found' },
        { status: 404 }
      );
    }

    // Only generate PDF if agreement has been signed
    if (testDrive.status !== 'AGREEMENT_SIGNED' && testDrive.status !== 'IN_PROGRESS' && testDrive.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Agreement not yet signed' },
        { status: 400 }
      );
    }

    // Check if PDF is already cached in blob storage
    const existingUrl = await getDocumentUrl(id, 'agreement', 'pdf');
    if (existingUrl) {
      // Try to download cached PDF
      const downloadResult = await downloadDocument(id, 'agreement', 'pdf');
      if (downloadResult.success && downloadResult.data) {
        return new NextResponse(new Uint8Array(downloadResult.data), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="test-drive-agreement-${id}.pdf"`,
            'Cache-Control': 'public, max-age=31536000', // Cache for 1 year (immutable once signed)
          },
        });
      }
    }

    // Generate new PDF
    // Get signature data from storage or use placeholder
    let signatureData = '';
    if (testDrive.signatureUrl) {
      // If signatureUrl is a data URL, use it directly
      if (testDrive.signatureUrl.startsWith('data:')) {
        signatureData = testDrive.signatureUrl;
      } else {
        // Try to download from storage
        const sigResult = await downloadDocument(id, 'signature', 'png');
        if (sigResult.success && sigResult.data) {
          signatureData = `data:image/png;base64,${sigResult.data.toString('base64')}`;
        }
      }
    }

    const pdfBuffer = await generateTestDrivePDF({
      testDrive: {
        id: testDrive.id,
        scheduledDate: testDrive.scheduledDate,
        scheduledTime: testDrive.scheduledTime,
        duration: testDrive.duration,
        ocrFullName: testDrive.ocrFullName,
        ocrLicenseNumber: testDrive.ocrLicenseNumber,
        ocrEmiratesIdNumber: testDrive.ocrEmiratesIdNumber,
        signedAt: testDrive.signedAt,
      },
      customer: testDrive.customer,
      vehicle: testDrive.vehicle,
      salesExecutive: testDrive.salesExecutive,
      signatureData,
      termsVersion: testDrive.termsVersion || '1.0',
    });

    // Cache PDF in blob storage (non-blocking)
    uploadAgreementPDF(id, pdfBuffer).catch((err) => {
      console.error('Failed to cache agreement PDF:', err);
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="test-drive-agreement-${id}.pdf"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error generating agreement PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate agreement PDF' },
      { status: 500 }
    );
  }
}
