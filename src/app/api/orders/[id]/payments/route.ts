import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, notFoundResponse, badRequestResponse } from '@/lib/api/response';
import { PaymentType } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params;

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    const payments = await prisma.paymentRequest.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    const transformedPayments = payments.map(p => ({
      ...p,
      amount: Number(p.amount),
    }));

    // Calculate payment summary
    const summary = {
      totalRequested: payments
        .filter(p => p.status !== 'REFUNDED')
        .reduce((sum, p) => sum + Number(p.amount), 0),
      totalCompleted: payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + Number(p.amount), 0),
      pendingPayments: payments.filter(p => p.status === 'PENDING' || p.status === 'REQUESTED').length,
    };

    return successResponse({
      payments: transformedPayments,
      summary,
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return serverErrorResponse('Failed to fetch payments');
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();

    const { type, amount, currency, requestedBy } = body;

    // Validation
    if (!type || !Object.values(PaymentType).includes(type)) {
      return badRequestResponse('Valid payment type is required');
    }
    if (!amount || amount <= 0) {
      return badRequestResponse('Valid amount is required');
    }
    if (!requestedBy) {
      return badRequestResponse('Requester ID is required');
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    // Create payment request
    const payment = await prisma.paymentRequest.create({
      data: {
        orderId,
        type,
        amount,
        currency: currency || 'AED',
        status: 'PENDING',
        requestedBy,
        requestedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        orderId,
        type: 'NOTE',
        channel: 'SYSTEM',
        summary: `Payment request created: ${currency || 'AED'} ${amount} (${type})`,
        performedById: requestedBy,
        performedAt: new Date(),
      },
    });

    return successResponse({
      ...payment,
      amount: Number(payment.amount),
    }, undefined, 201);
  } catch (error) {
    console.error('Error creating payment request:', error);
    return serverErrorResponse('Failed to create payment request');
  }
}
