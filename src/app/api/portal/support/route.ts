import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, notFoundResponse, serverErrorResponse, badRequestResponse } from '@/lib/api/response';

// POST /api/portal/support
// Create a support request from customer portal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, subject, message, category } = body;

    if (!orderId) {
      return badRequestResponse('orderId is required');
    }

    if (!message) {
      return badRequestResponse('message is required');
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    // Log the support request as an activity
    const activity = await prisma.activity.create({
      data: {
        orderId,
        type: 'NOTE',
        channel: 'SYSTEM',
        summary: `Support request: ${subject || 'General Inquiry'}`,
        details: JSON.stringify({
          category: category || 'general',
          message,
          submittedAt: new Date().toISOString(),
        }),
        sentiment: 'NEUTRAL',
        performedAt: new Date(),
      },
    });

    // Create notification for salesperson if assigned
    if (order.salespersonId) {
      await prisma.notification.create({
        data: {
          userId: order.salespersonId,
          type: 'SYSTEM',
          title: 'New Support Request',
          message: `${order.customer.name} submitted a support request: ${subject || 'General Inquiry'}`,
          link: `/orders/${orderId}`,
          referenceId: orderId,
          referenceType: 'order',
        },
      });
    }

    // Update order's lastContactAt
    await prisma.order.update({
      where: { id: orderId },
      data: {
        lastContactAt: new Date(),
      },
    });

    return successResponse({
      id: activity.id,
      message: 'Support request submitted successfully',
      ticketNumber: `SR-${Date.now().toString(36).toUpperCase()}`,
    }, undefined, 201);
  } catch (error) {
    console.error('Error creating support request:', error);
    return serverErrorResponse('Failed to create support request');
  }
}
