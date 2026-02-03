import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, notFoundResponse, serverErrorResponse, badRequestResponse } from '@/lib/api/response';
import { DocumentStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/documents/[id]/review
// Approve or reject a document
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reviewedBy, notes } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return badRequestResponse('action must be "approve" or "reject"');
    }

    // Find the document
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        order: {
          include: { customer: true },
        },
      },
    });

    if (!document) {
      return notFoundResponse('Document not found');
    }

    // Only allow review of uploaded or under review documents
    if (!['UPLOADED', 'UNDER_REVIEW'].includes(document.status)) {
      return badRequestResponse(
        `Cannot review document with status ${document.status}`
      );
    }

    const newStatus: DocumentStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedBy: reviewedBy || null,
        reviewedAt: new Date(),
        reviewNotes: notes || null,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        orderId: document.orderId,
        type: 'NOTE',
        channel: 'SYSTEM',
        summary: `Document ${action}d: ${document.name}`,
        details: notes || null,
        performedAt: new Date(),
      },
    });

    // Create notification for customer (via order's customer portal)
    // This would typically be sent via email/SMS in production

    return successResponse({
      id: updatedDocument.id,
      status: updatedDocument.status,
      reviewedAt: updatedDocument.reviewedAt,
      reviewNotes: updatedDocument.reviewNotes,
      message: `Document ${action}d successfully`,
    });
  } catch (error) {
    console.error('Error reviewing document:', error);
    return serverErrorResponse('Failed to review document');
  }
}
