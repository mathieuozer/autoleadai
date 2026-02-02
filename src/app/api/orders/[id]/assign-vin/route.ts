import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, notFoundResponse, badRequestResponse } from '@/lib/api/response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();

    const { vin, assignedBy } = body;

    if (!vin) {
      return badRequestResponse('VIN is required');
    }

    // Validate VIN format (17 characters, alphanumeric)
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
      return badRequestResponse('Invalid VIN format. VIN must be 17 alphanumeric characters.');
    }

    // Check if VIN is already assigned to another order
    const existingOrder = await prisma.order.findFirst({
      where: {
        vinNumber: vin.toUpperCase(),
        id: { not: orderId },
      },
    });

    if (existingOrder) {
      return badRequestResponse('VIN is already assigned to another order');
    }

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        paymentRequests: {
          where: { type: 'DOWN_PAYMENT', status: 'COMPLETED' },
        },
      },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    // Verify down payment is completed
    if (order.paymentRequests.length === 0) {
      return badRequestResponse('Cannot assign VIN before down payment is completed');
    }

    // Check if VIN exists in inventory
    const inventoryItem = await prisma.vehicleInventory.findUnique({
      where: { vin: vin.toUpperCase() },
    });

    // Update order with VIN
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        vinNumber: vin.toUpperCase(),
      },
      include: {
        customer: true,
        vehicle: true,
      },
    });

    // If inventory item exists, update it to RESERVED
    if (inventoryItem) {
      await prisma.vehicleInventory.update({
        where: { id: inventoryItem.id },
        data: {
          status: 'RESERVED',
          orderId,
          reservedBy: assignedBy || null,
          reservedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days reservation
        },
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        orderId,
        type: 'NOTE',
        channel: 'SYSTEM',
        summary: `VIN assigned: ${vin.toUpperCase()}`,
        performedById: assignedBy || null,
        performedAt: new Date(),
      },
    });

    return successResponse({
      ...updatedOrder,
      totalAmount: Number(updatedOrder.totalAmount),
      bookingAmount: updatedOrder.bookingAmount ? Number(updatedOrder.bookingAmount) : null,
      vinNumber: updatedOrder.vinNumber,
    });
  } catch (error) {
    console.error('Error assigning VIN:', error);
    return serverErrorResponse('Failed to assign VIN');
  }
}
