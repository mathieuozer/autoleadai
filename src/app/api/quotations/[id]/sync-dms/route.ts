import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, notFoundResponse, badRequestResponse } from '@/lib/api/response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { syncedBy, dmsSystem = 'default' } = body;

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

    if (quotation.status === 'DRAFT') {
      return badRequestResponse('Quotation must be issued before syncing to DMS');
    }

    if (quotation.dmsQuotationId) {
      return badRequestResponse('Quotation has already been synced to DMS');
    }

    // TODO: Integrate with actual DMS API
    // This is a stub implementation that simulates DMS sync
    // In production, this would call the DMS API to create a quotation record

    // Simulate DMS sync
    const dmsQuotationId = `DMS-${dmsSystem.toUpperCase()}-${Date.now()}`;

    // Update quotation with DMS reference
    const updatedQuotation = await prisma.quotation.update({
      where: { id },
      data: {
        dmsQuotationId,
        dmsSyncedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        orderId: quotation.orderId,
        type: 'NOTE',
        channel: 'SYSTEM',
        summary: `Quotation synced to DMS: ${dmsQuotationId}`,
        performedById: syncedBy || null,
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
      dmsSync: {
        system: dmsSystem,
        quotationId: dmsQuotationId,
        syncedAt: updatedQuotation.dmsSyncedAt,
      },
    });
  } catch (error) {
    console.error('Error syncing quotation to DMS:', error);
    return serverErrorResponse('Failed to sync quotation to DMS');
  }
}
