import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, notFoundResponse, badRequestResponse } from '@/lib/api/response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { rejectedBy, reason } = body;

    if (!rejectedBy) {
      return badRequestResponse('Rejector ID is required');
    }
    if (!reason || reason.trim().length < 10) {
      return badRequestResponse('Rejection reason must be at least 10 characters');
    }

    // Find discount request
    const discount = await prisma.discountRequest.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!discount) {
      return notFoundResponse('Discount request not found');
    }

    if (discount.status === 'APPROVED') {
      return badRequestResponse('Cannot reject an approved discount');
    }
    if (discount.status === 'REJECTED') {
      return badRequestResponse('Discount has already been rejected');
    }

    // Update discount request
    const updatedDiscount = await prisma.discountRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        orderId: discount.orderId,
        type: 'NOTE',
        channel: 'SYSTEM',
        summary: `Discount rejected: ${reason.substring(0, 50)}...`,
        performedById: rejectedBy,
        performedAt: new Date(),
      },
    });

    // Notify requester
    await prisma.notification.create({
      data: {
        userId: discount.requestedBy,
        type: 'SYSTEM',
        title: 'Discount Rejected',
        message: `Your discount request of AED ${discount.requestedDiscount} has been rejected: ${reason.substring(0, 100)}`,
        referenceId: discount.orderId,
        referenceType: 'order',
        link: `/orders/${discount.orderId}`,
      },
    });

    return successResponse({
      ...updatedDiscount,
      originalPrice: Number(updatedDiscount.originalPrice),
      campaignDiscount: Number(updatedDiscount.campaignDiscount),
      requestedDiscount: Number(updatedDiscount.requestedDiscount),
      finalPrice: Number(updatedDiscount.finalPrice),
    });
  } catch (error) {
    console.error('Error rejecting discount:', error);
    return serverErrorResponse('Failed to reject discount');
  }
}
