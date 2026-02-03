import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, notFoundResponse, serverErrorResponse, badRequestResponse } from '@/lib/api/response';
import { DocumentType, DocumentStatus } from '@prisma/client';

// GET /api/portal/documents?orderId=xxx
// Returns all documents for an order
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return badRequestResponse('orderId is required');
    }

    const documents = await prisma.document.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    const transformedDocs = documents.map(doc => ({
      id: doc.id,
      type: doc.type,
      status: doc.status,
      name: doc.name,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt,
      reviewedAt: doc.reviewedAt,
      reviewNotes: doc.reviewNotes,
    }));

    return successResponse(transformedDocs);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return serverErrorResponse('Failed to fetch documents');
  }
}

// POST /api/portal/documents
// Upload a new document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, type, name, fileUrl, fileName, fileSize, mimeType } = body;

    if (!orderId) {
      return badRequestResponse('orderId is required');
    }

    if (!type || !Object.values(DocumentType).includes(type)) {
      return badRequestResponse('Valid document type is required');
    }

    if (!name) {
      return badRequestResponse('Document name is required');
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    // Create or update document
    // Check if a document of this type already exists for this order
    const existingDoc = await prisma.document.findFirst({
      where: { orderId, type },
    });

    let document;
    if (existingDoc) {
      // Update existing document
      document = await prisma.document.update({
        where: { id: existingDoc.id },
        data: {
          name,
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          fileSize: fileSize || null,
          mimeType: mimeType || null,
          status: fileUrl ? DocumentStatus.UPLOADED : DocumentStatus.PENDING,
          uploadedAt: fileUrl ? new Date() : null,
          reviewedAt: null,
          reviewedBy: null,
          reviewNotes: null,
        },
      });
    } else {
      // Create new document
      document = await prisma.document.create({
        data: {
          orderId,
          type,
          name,
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          fileSize: fileSize || null,
          mimeType: mimeType || null,
          status: fileUrl ? DocumentStatus.UPLOADED : DocumentStatus.PENDING,
          uploadedAt: fileUrl ? new Date() : null,
        },
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        orderId,
        type: 'NOTE',
        channel: 'SYSTEM',
        summary: `Document ${existingDoc ? 'updated' : 'uploaded'}: ${name}`,
        performedAt: new Date(),
      },
    });

    return successResponse({
      id: document.id,
      type: document.type,
      status: document.status,
      name: document.name,
      fileName: document.fileName,
      fileSize: document.fileSize,
      uploadedAt: document.uploadedAt,
    }, undefined, existingDoc ? 200 : 201);
  } catch (error) {
    console.error('Error creating document:', error);
    return serverErrorResponse('Failed to create document');
  }
}
