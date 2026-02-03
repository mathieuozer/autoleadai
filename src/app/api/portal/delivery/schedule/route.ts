import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, notFoundResponse, serverErrorResponse, badRequestResponse } from '@/lib/api/response';

// POST /api/portal/delivery/schedule
// Schedule or update delivery date
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, deliveryDate, notes } = body;

    if (!orderId) {
      return badRequestResponse('orderId is required');
    }

    if (!deliveryDate) {
      return badRequestResponse('deliveryDate is required');
    }

    // Parse and validate date
    const parsedDate = new Date(deliveryDate);
    if (isNaN(parsedDate.getTime())) {
      return badRequestResponse('Invalid delivery date');
    }

    // Ensure date is in the future
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (parsedDate < now) {
      return badRequestResponse('Delivery date must be in the future');
    }

    // Verify order exists and is in a valid state for scheduling
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    // Only allow scheduling for orders that are ready for delivery or close to it
    const validStatuses = ['FINANCING_APPROVED', 'READY_FOR_DELIVERY'];
    if (!validStatuses.includes(order.status)) {
      return badRequestResponse(
        'Delivery can only be scheduled for orders with approved financing or ready for delivery status'
      );
    }

    // Update order with new delivery date
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        expectedDeliveryDate: parsedDate,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        orderId,
        type: 'NOTE',
        channel: 'SYSTEM',
        summary: `Delivery scheduled for ${parsedDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`,
        details: notes || null,
        performedAt: new Date(),
      },
    });

    // Create notification for salesperson if assigned
    if (order.salespersonId) {
      await prisma.notification.create({
        data: {
          userId: order.salespersonId,
          type: 'ORDER_STATUS_CHANGE',
          title: 'Delivery Scheduled',
          message: `${order.customer.name} has scheduled delivery for ${parsedDate.toLocaleDateString()}`,
          link: `/orders/${orderId}`,
          referenceId: orderId,
          referenceType: 'order',
        },
      });
    }

    return successResponse({
      orderId: updatedOrder.id,
      expectedDeliveryDate: updatedOrder.expectedDeliveryDate,
      message: 'Delivery scheduled successfully',
    });
  } catch (error) {
    console.error('Error scheduling delivery:', error);
    return serverErrorResponse('Failed to schedule delivery');
  }
}
