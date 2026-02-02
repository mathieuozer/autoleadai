import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, notFoundResponse, badRequestResponse } from '@/lib/api/response';
import { DiscountStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { approvedBy, comment, approverRole } = body;

    if (!approvedBy) {
      return badRequestResponse('Approver ID is required');
    }
    if (!approverRole || !['BRANCH_MANAGER', 'ADMIN'].includes(approverRole)) {
      return badRequestResponse('Valid approver role is required (BRANCH_MANAGER or ADMIN/GM)');
    }

    // Find discount request
    const discount = await prisma.discountRequest.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!discount) {
      return notFoundResponse('Discount request not found');
    }

    if (discount.status === DiscountStatus.APPROVED) {
      return badRequestResponse('Discount is already approved');
    }
    if (discount.status === DiscountStatus.REJECTED) {
      return badRequestResponse('Discount has been rejected');
    }

    const isBM = approverRole === 'BRANCH_MANAGER';
    const isGM = approverRole === 'ADMIN'; // GM is ADMIN role in our system

    // Validate approval sequence
    if (isBM && discount.currentLevel >= 1) {
      return badRequestResponse('BM has already approved this discount');
    }
    if (isGM && discount.currentLevel < 1) {
      return badRequestResponse('BM approval is required before GM approval');
    }

    // Determine new status
    let newStatus: DiscountStatus = discount.status;
    let newLevel = discount.currentLevel;
    const updateData: Record<string, unknown> = {};

    if (isBM) {
      newLevel = 1;
      updateData.bmApprovedBy = approvedBy;
      updateData.bmApprovedAt = new Date();
      updateData.bmComment = comment || null;

      if (discount.requiredLevel === 1) {
        // BM approval is sufficient
        newStatus = DiscountStatus.APPROVED;
      } else {
        // Needs GM approval
        newStatus = DiscountStatus.PENDING_GM;

        // Notify GM
        await prisma.notification.create({
          data: {
            userId: 'general-manager', // Placeholder
            type: 'SYSTEM',
            title: 'Discount Approval Required',
            message: `A discount of AED ${discount.requestedDiscount} has been approved by BM and requires GM approval`,
            referenceId: id,
            referenceType: 'discount',
            link: `/approvals/discounts?id=${id}`,
          },
        });
      }
    } else if (isGM) {
      newLevel = 2;
      newStatus = DiscountStatus.APPROVED;
      updateData.gmApprovedBy = approvedBy;
      updateData.gmApprovedAt = new Date();
      updateData.gmComment = comment || null;
    }

    updateData.status = newStatus;
    updateData.currentLevel = newLevel;

    // Update discount request
    const updatedDiscount = await prisma.discountRequest.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    const approverLabel = isBM ? 'Branch Manager' : 'General Manager';
    await prisma.activity.create({
      data: {
        orderId: discount.orderId,
        type: 'NOTE',
        channel: 'SYSTEM',
        summary: newStatus === DiscountStatus.APPROVED
          ? `Discount approved by ${approverLabel}: AED ${discount.requestedDiscount}`
          : `Discount approved by ${approverLabel}, pending GM approval`,
        performedById: approvedBy,
        performedAt: new Date(),
      },
    });

    // If fully approved, update order price
    if (newStatus === DiscountStatus.APPROVED) {
      await prisma.order.update({
        where: { id: discount.orderId },
        data: {
          totalAmount: discount.finalPrice,
        },
      });

      // Notify requester
      await prisma.notification.create({
        data: {
          userId: discount.requestedBy,
          type: 'SYSTEM',
          title: 'Discount Approved',
          message: `Your discount request of AED ${discount.requestedDiscount} has been approved`,
          referenceId: discount.orderId,
          referenceType: 'order',
          link: `/orders/${discount.orderId}`,
        },
      });
    }

    return successResponse({
      ...updatedDiscount,
      originalPrice: Number(updatedDiscount.originalPrice),
      campaignDiscount: Number(updatedDiscount.campaignDiscount),
      requestedDiscount: Number(updatedDiscount.requestedDiscount),
      finalPrice: Number(updatedDiscount.finalPrice),
    });
  } catch (error) {
    console.error('Error approving discount:', error);
    return serverErrorResponse('Failed to approve discount');
  }
}
