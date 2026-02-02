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

    const { paymentMethod, reference, processedBy } = body;

    // Find payment
    const payment = await prisma.paymentRequest.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!payment) {
      return notFoundResponse('Payment request not found');
    }

    if (payment.status === 'COMPLETED') {
      return badRequestResponse('Payment is already completed');
    }

    if (payment.status === 'REFUNDED') {
      return badRequestResponse('Cannot complete a refunded payment');
    }

    // Update payment
    const updatedPayment = await prisma.paymentRequest.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        paymentMethod: paymentMethod || null,
        reference: reference || null,
        processedBy: processedBy || null,
        processedAt: new Date(),
        paidAt: new Date(),
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        orderId: payment.orderId,
        type: 'NOTE',
        channel: 'SYSTEM',
        summary: `Payment completed: ${payment.currency} ${payment.amount} (${payment.type})`,
        performedById: processedBy || null,
        performedAt: new Date(),
      },
    });

    // If this is a down payment and order has variant, check if we should update order status
    if (payment.type === 'DOWN_PAYMENT') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'BOOKING_DONE',
          bookingAmount: payment.amount,
        },
      });

      // Log status change
      await prisma.activity.create({
        data: {
          orderId: payment.orderId,
          type: 'STATUS_CHANGE',
          channel: 'SYSTEM',
          summary: 'Order status changed to BOOKING_DONE after down payment',
          performedById: processedBy || null,
          performedAt: new Date(),
        },
      });
    }

    return successResponse({
      ...updatedPayment,
      amount: Number(updatedPayment.amount),
    });
  } catch (error) {
    console.error('Error completing payment:', error);
    return serverErrorResponse('Failed to complete payment');
  }
}
