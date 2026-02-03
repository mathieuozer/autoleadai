import { prisma, OrderStatus } from '@/lib/db';
import { successResponse, serverErrorResponse } from '@/lib/api/response';

// GET /api/backoffice/pipeline
// Returns pipeline stage counts for back office dashboard
export async function GET() {
  try {
    // Get counts for each stage
    const [
      documentsCount,
      financingCount,
      allocationCount,
      deliveryCount,
    ] = await Promise.all([
      prisma.order.count({
        where: { status: OrderStatus.BOOKING_DONE },
      }),
      prisma.order.count({
        where: { status: OrderStatus.FINANCING_PENDING },
      }),
      prisma.order.count({
        where: { status: OrderStatus.FINANCING_APPROVED },
      }),
      prisma.order.count({
        where: { status: OrderStatus.READY_FOR_DELIVERY },
      }),
    ]);

    // For PDI, we'll use a custom count - orders that have VIN assigned but not yet ready for delivery
    const pdiCount = await prisma.order.count({
      where: {
        status: 'FINANCING_APPROVED',
        vinNumber: { not: null },
      },
    });

    // Adjust allocation count to exclude PDI items
    const adjustedAllocationCount = Math.max(0, allocationCount - pdiCount);

    const stages = [
      {
        id: 'documents',
        name: 'Document Review',
        count: documentsCount,
        color: '#7c3aed',
      },
      {
        id: 'financing',
        name: 'Financing',
        count: financingCount,
        color: '#3B82F6',
      },
      {
        id: 'allocation',
        name: 'Vehicle Allocation',
        count: adjustedAllocationCount,
        color: '#8B5CF6',
      },
      {
        id: 'pdi',
        name: 'PDI',
        count: pdiCount,
        color: '#F59E0B',
      },
      {
        id: 'delivery',
        name: 'Ready for Delivery',
        count: deliveryCount,
        color: '#10B981',
      },
    ];

    return successResponse(stages);
  } catch (error) {
    console.error('Error fetching pipeline data:', error);
    return serverErrorResponse('Failed to fetch pipeline data');
  }
}
