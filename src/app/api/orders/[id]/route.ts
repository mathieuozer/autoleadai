import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, notFoundResponse, serverErrorResponse, badRequestResponse } from '@/lib/api/response';
import { OrderStatus, FinancingStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        salesperson: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        activities: {
          orderBy: { performedAt: 'desc' },
          include: {
            performedBy: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        priorityItems: {
          orderBy: { generatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    // Transform order
    const transformedOrder = {
      ...order,
      totalAmount: Number(order.totalAmount),
      bookingAmount: order.bookingAmount ? Number(order.bookingAmount) : null,
      lastContactDaysAgo: order.lastContactAt
        ? Math.floor((Date.now() - new Date(order.lastContactAt).getTime()) / (1000 * 60 * 60 * 24))
        : null,
      latestPriority: order.priorityItems[0] || null,
    };

    return successResponse(transformedOrder);
  } catch (error) {
    console.error('Error fetching order:', error);
    return serverErrorResponse('Failed to fetch order');
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return notFoundResponse('Order not found');
    }

    // Validate status if provided
    if (body.status && !Object.values(OrderStatus).includes(body.status)) {
      return badRequestResponse(`Invalid status: ${body.status}`);
    }

    // Validate financingStatus if provided
    if (body.financingStatus && !Object.values(FinancingStatus).includes(body.financingStatus)) {
      return badRequestResponse(`Invalid financingStatus: ${body.financingStatus}`);
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.status) updateData.status = body.status;
    if (body.financingStatus) updateData.financingStatus = body.financingStatus;
    if (body.expectedDeliveryDate) updateData.expectedDeliveryDate = new Date(body.expectedDeliveryDate);
    if (body.riskScore !== undefined) updateData.riskScore = body.riskScore;
    if (body.riskLevel) updateData.riskLevel = body.riskLevel;
    if (body.fulfillmentProbability !== undefined) updateData.fulfillmentProbability = body.fulfillmentProbability;
    if (body.salespersonId) updateData.salespersonId = body.salespersonId;

    // If status is DELIVERED, set deliveredAt
    if (body.status === 'DELIVERED' && !existingOrder.deliveredAt) {
      updateData.deliveredAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        vehicle: true,
        salesperson: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Log status change activity if status was updated
    if (body.status && body.status !== existingOrder.status) {
      await prisma.activity.create({
        data: {
          orderId: id,
          type: 'STATUS_CHANGE',
          channel: 'SYSTEM',
          summary: `Status changed from ${existingOrder.status} to ${body.status}`,
          performedAt: new Date(),
        },
      });
    }

    return successResponse({
      ...updatedOrder,
      totalAmount: Number(updatedOrder.totalAmount),
      bookingAmount: updatedOrder.bookingAmount ? Number(updatedOrder.bookingAmount) : null,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return serverErrorResponse('Failed to update order');
  }
}
