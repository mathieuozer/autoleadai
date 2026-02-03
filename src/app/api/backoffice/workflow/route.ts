import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse } from '@/lib/api/response';
import { OrderStatus } from '@prisma/client';

// SLA limits in hours
const SLA_LIMITS: Record<string, number> = {
  BOOKING_DONE: 48,          // 2 days for document review
  FINANCING_PENDING: 72,     // 3 days for financing
  FINANCING_APPROVED: 48,    // 2 days for vehicle allocation
  READY_FOR_DELIVERY: 24,    // 1 day to deliver
};

function calculateSlaStatus(
  status: string,
  updatedAt: Date
): { status: 'on-track' | 'at-risk' | 'overdue'; time: string } {
  const limitHours = SLA_LIMITS[status] || 72;
  const now = new Date();
  const hoursSinceUpdate = (now.getTime() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);
  const hoursRemaining = limitHours - hoursSinceUpdate;

  if (hoursRemaining < 0) {
    const hoursOver = Math.abs(hoursRemaining);
    if (hoursOver >= 24) {
      return { status: 'overdue', time: `${Math.floor(hoursOver / 24)}d over` };
    }
    return { status: 'overdue', time: `${Math.floor(hoursOver)}h over` };
  }

  const percentUsed = (hoursSinceUpdate / limitHours) * 100;

  if (percentUsed > 70) {
    if (hoursRemaining < 1) {
      return { status: 'at-risk', time: `${Math.floor(hoursRemaining * 60)}m left` };
    }
    return { status: 'at-risk', time: `${Math.floor(hoursRemaining)}h left` };
  }

  if (hoursRemaining >= 24) {
    return { status: 'on-track', time: `${Math.floor(hoursRemaining / 24)}d left` };
  }
  return { status: 'on-track', time: `${Math.floor(hoursRemaining)}h left` };
}

function getStageFromStatus(status: OrderStatus): string {
  switch (status) {
    case 'BOOKING_DONE':
      return 'Document Review';
    case 'FINANCING_PENDING':
      return 'Financing';
    case 'FINANCING_APPROVED':
      return 'Vehicle Allocation';
    case 'READY_FOR_DELIVERY':
      return 'Ready for Delivery';
    default:
      return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
}

// GET /api/backoffice/workflow
// Returns workflow items with SLA status for back office dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const stage = searchParams.get('stage') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // Map stage filter to order statuses
    const stageToStatus: Record<string, OrderStatus[]> = {
      documents: ['BOOKING_DONE'],
      financing: ['FINANCING_PENDING'],
      allocation: ['FINANCING_APPROVED'],
      delivery: ['READY_FOR_DELIVERY'],
    };

    // Build where clause
    const whereClause: Record<string, unknown> = {
      status: {
        in: ['BOOKING_DONE', 'FINANCING_PENDING', 'FINANCING_APPROVED', 'READY_FOR_DELIVERY'],
      },
    };

    // Apply stage filter
    if (stage && stageToStatus[stage]) {
      whereClause.status = { in: stageToStatus[stage] };
    }

    // Apply search filter
    if (search) {
      whereClause.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { vehicle: { make: { contains: search, mode: 'insensitive' } } },
        { vehicle: { model: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          customer: {
            select: { name: true },
          },
          vehicle: {
            select: { make: true, model: true, year: true },
          },
          salesperson: {
            select: { id: true, name: true },
          },
        },
        orderBy: [
          { riskLevel: 'desc' },
          { updatedAt: 'asc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    // Transform orders to workflow items
    const workflowItems = orders.map(order => {
      const sla = calculateSlaStatus(order.status, order.updatedAt);

      return {
        id: order.id,
        orderNumber: `ORD-${order.createdAt.getFullYear()}-${order.id.slice(-4).toUpperCase()}`,
        customerName: order.customer.name,
        vehicleInfo: `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}`,
        stage: getStageFromStatus(order.status),
        assignee: order.salesperson ? { name: order.salesperson.name.split(' ')[0] + ' ' + (order.salesperson.name.split(' ')[1]?.[0] || '') + '.' } : null,
        slaStatus: sla.status,
        slaTime: sla.time,
        priority: order.riskLevel === 'HIGH' ? 'high' : undefined,
      };
    });

    return successResponse(workflowItems, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching workflow data:', error);
    return serverErrorResponse('Failed to fetch workflow data');
  }
}
