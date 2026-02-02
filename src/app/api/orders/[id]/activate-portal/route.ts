import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, notFoundResponse, badRequestResponse } from '@/lib/api/response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();

    const { activatedBy } = body;

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
      },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    // Check if already activated
    if (order.portalActivated) {
      return badRequestResponse('Customer portal is already activated');
    }

    // Verify VIN is assigned
    if (!order.vinNumber) {
      return badRequestResponse('Cannot activate portal before VIN is assigned');
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        portalActivated: true,
        portalActivatedAt: new Date(),
      },
      include: {
        customer: true,
        vehicle: true,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        orderId,
        type: 'NOTE',
        channel: 'SYSTEM',
        summary: 'Customer portal activated',
        performedById: activatedBy || null,
        performedAt: new Date(),
      },
    });

    // Create notification for customer (if they have an email)
    if (order.customer.email) {
      await prisma.notification.create({
        data: {
          // In a real app, this would be the customer's portal user ID
          // For now, using the salesperson ID as recipient for demo
          userId: order.salespersonId || activatedBy || 'system',
          type: 'ORDER_STATUS_CHANGE',
          title: 'Customer Portal Activated',
          message: `Portal access activated for ${order.customer.name}. Customer can now track their order online.`,
          referenceId: orderId,
          referenceType: 'order',
        },
      });
    }

    // TODO: Send email to customer with portal access link
    // This would integrate with an email service like SendGrid or AWS SES

    return successResponse({
      ...updatedOrder,
      totalAmount: Number(updatedOrder.totalAmount),
      bookingAmount: updatedOrder.bookingAmount ? Number(updatedOrder.bookingAmount) : null,
      portalActivated: true,
      portalActivatedAt: updatedOrder.portalActivatedAt,
      message: 'Customer portal activated successfully',
    });
  } catch (error) {
    console.error('Error activating portal:', error);
    return serverErrorResponse('Failed to activate customer portal');
  }
}
