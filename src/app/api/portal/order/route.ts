import { NextRequest } from 'next/server';
import { prisma, PaymentStatus } from '@/lib/db';
import { successResponse, notFoundResponse, serverErrorResponse, badRequestResponse } from '@/lib/api/response';

// GET /api/portal/order?orderId=xxx
// Returns order with all relations for customer portal
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return badRequestResponse('orderId is required');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
        activities: {
          orderBy: { performedAt: 'desc' },
          take: 10,
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        paymentRequests: {
          where: { status: PaymentStatus.COMPLETED },
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    // Calculate stats
    const totalAmount = Number(order.totalAmount);
    const completedPayments = order.paymentRequests.reduce(
      (sum, pr) => sum + Number(pr.amount),
      0
    );
    const paymentPercentage = totalAmount > 0 ? Math.round((completedPayments / totalAmount) * 100) : 0;

    const documentsApproved = order.documents.filter(d => d.status === 'APPROVED').length;
    const documentsTotal = order.documents.length;

    // Calculate days to delivery
    let daysToDelivery: number | null = null;
    if (order.expectedDeliveryDate) {
      const now = new Date();
      const delivery = new Date(order.expectedDeliveryDate);
      daysToDelivery = Math.max(0, Math.ceil((delivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // Map order status to timeline step
    const statusToStep: Record<string, number> = {
      NEW: 1,
      CONTACTED: 1,
      TEST_DRIVE_SCHEDULED: 1,
      TEST_DRIVE_DONE: 1,
      NEGOTIATION: 1,
      BOOKING_DONE: 2,
      FINANCING_PENDING: 3,
      FINANCING_APPROVED: 4,
      READY_FOR_DELIVERY: 5,
      DELIVERED: 6,
      CANCELLED: 0,
    };

    const currentStep = statusToStep[order.status] || 1;

    // Transform order
    const transformedOrder = {
      id: order.id,
      status: order.status,
      customer: order.customer,
      vehicle: {
        id: order.vehicle.id,
        make: order.vehicle.make,
        model: order.vehicle.model,
        variant: order.vehicle.variant,
        year: order.vehicle.year,
        color: order.vehicle.color,
        vin: order.vinNumber || order.vehicle.vin,
      },
      salesperson: order.salesperson,
      createdAt: order.createdAt,
      expectedDeliveryDate: order.expectedDeliveryDate,
      deliveredAt: order.deliveredAt,
      financingStatus: order.financingStatus,
      portalActivated: order.portalActivated,
      portalActivatedAt: order.portalActivatedAt,
      activities: order.activities,
      documents: order.documents.map(doc => ({
        id: doc.id,
        type: doc.type,
        status: doc.status,
        name: doc.name,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        uploadedAt: doc.uploadedAt,
        reviewedAt: doc.reviewedAt,
        reviewNotes: doc.reviewNotes,
      })),
      stats: {
        currentStep,
        totalSteps: 6,
        daysToDelivery,
        documentsApproved,
        documentsTotal,
        paymentPercentage,
        amountPaid: completedPayments,
        totalAmount,
      },
    };

    return successResponse(transformedOrder);
  } catch (error) {
    console.error('Error fetching portal order:', error);
    return serverErrorResponse('Failed to fetch order');
  }
}
