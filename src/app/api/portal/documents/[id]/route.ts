import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/portal/documents/[id]
// Get document details or redirect to download URL
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === 'true';

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return notFoundResponse('Document not found');
    }

    // If download requested and file URL exists, redirect to file
    if (download && document.fileUrl) {
      return NextResponse.redirect(document.fileUrl);
    }

    // Return document details
    return successResponse({
      id: document.id,
      type: document.type,
      status: document.status,
      name: document.name,
      fileName: document.fileName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      fileUrl: document.fileUrl,
      uploadedAt: document.uploadedAt,
      reviewedAt: document.reviewedAt,
      reviewNotes: document.reviewNotes,
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return serverErrorResponse('Failed to fetch document');
  }
}

// DELETE /api/portal/documents/[id]
// Delete a document (only if status is PENDING or UPLOADED)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return notFoundResponse('Document not found');
    }

    // Only allow deletion of pending or uploaded documents
    if (!['PENDING', 'UPLOADED'].includes(document.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot delete document that is under review or has been processed',
          },
        },
        { status: 403 }
      );
    }

    await prisma.document.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return serverErrorResponse('Failed to delete document');
  }
}
