import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, notFoundResponse, badRequestResponse } from '@/lib/api/response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Find quotation
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            vehicle: true,
          },
        },
      },
    });

    if (!quotation) {
      return notFoundResponse('Quotation not found');
    }

    if (quotation.status !== 'DRAFT') {
      return badRequestResponse(`Cannot issue a quotation with status: ${quotation.status}`);
    }

    // Check validity
    if (new Date(quotation.validUntil) <= new Date()) {
      return badRequestResponse('Quotation validity date has passed. Please create a new quotation.');
    }

    // Update status to ISSUED
    const updatedQuotation = await prisma.quotation.update({
      where: { id },
      data: {
        status: 'ISSUED',
        issuedAt: new Date(),
      },
    });

    // TODO: Generate PDF and store URL
    // This would integrate with a PDF generation service
    // const pdfUrl = await generateQuotationPdf(quotation);
    // await prisma.quotation.update({ where: { id }, data: { pdfUrl } });

    // Log activity
    await prisma.activity.create({
      data: {
        orderId: quotation.orderId,
        type: 'NOTE',
        channel: 'SYSTEM',
        summary: `Quotation ${quotation.quotationNumber} issued`,
        performedById: quotation.issuedBy,
        performedAt: new Date(),
      },
    });

    return successResponse({
      ...updatedQuotation,
      vehiclePrice: Number(updatedQuotation.vehiclePrice),
      campaignDiscount: Number(updatedQuotation.campaignDiscount),
      additionalDiscount: Number(updatedQuotation.additionalDiscount),
      accessories: Number(updatedQuotation.accessories),
      fees: Number(updatedQuotation.fees),
      totalAmount: Number(updatedQuotation.totalAmount),
    });
  } catch (error) {
    console.error('Error issuing quotation:', error);
    return serverErrorResponse('Failed to issue quotation');
  }
}
