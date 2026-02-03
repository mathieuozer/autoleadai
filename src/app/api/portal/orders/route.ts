import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse } from '@/lib/api/response';

// GET /api/portal/orders
// Returns list of orders for the customer portal dashboard
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: {
          not: 'CANCELLED',
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            variant: true,
            year: true,
            color: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    const transformedOrders = orders.map(order => ({
      id: order.id,
      status: order.status,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      vehicle: `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}`,
      vehicleColor: order.vehicle.color,
      createdAt: order.createdAt,
      expectedDeliveryDate: order.expectedDeliveryDate,
    }));

    return successResponse(transformedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return serverErrorResponse('Failed to fetch orders');
  }
}
