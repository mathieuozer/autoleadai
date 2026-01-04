import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, badRequestResponse } from '@/lib/api/response';
import { OrderStatus, RiskLevel } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
    const skip = (page - 1) * pageSize;

    // Filters
    const status = searchParams.get('status') as OrderStatus | null;
    const riskLevel = searchParams.get('riskLevel') as RiskLevel | null;
    const salespersonId = searchParams.get('salespersonId');
    const search = searchParams.get('search');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) {
      if (!Object.values(OrderStatus).includes(status)) {
        return badRequestResponse(`Invalid status: ${status}`);
      }
      where.status = status;
    }

    if (riskLevel) {
      if (!Object.values(RiskLevel).includes(riskLevel)) {
        return badRequestResponse(`Invalid riskLevel: ${riskLevel}`);
      }
      where.riskLevel = riskLevel;
    }

    if (salespersonId) {
      where.salespersonId = salespersonId;
    }

    if (search) {
      where.OR = [
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } },
        { vehicle: { make: { contains: search, mode: 'insensitive' } } },
        { vehicle: { model: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Exclude delivered and cancelled by default (active orders)
    const excludeCompleted = searchParams.get('includeCompleted') !== 'true';
    if (excludeCompleted) {
      where.status = {
        notIn: ['DELIVERED', 'CANCELLED'],
        ...(status && { equals: status }),
      };
      // If status filter is already set, don't override
      if (status) {
        where.status = status;
      }
    }

    // Execute queries
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
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
            take: 5,
          },
        },
        orderBy: [
          { riskScore: 'desc' },
          { updatedAt: 'desc' },
        ],
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    // Transform orders to include computed fields
    const transformedOrders = orders.map(order => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      bookingAmount: order.bookingAmount ? Number(order.bookingAmount) : null,
      lastContactDaysAgo: order.lastContactAt
        ? Math.floor((Date.now() - new Date(order.lastContactAt).getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }));

    return successResponse(transformedOrders, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return serverErrorResponse('Failed to fetch orders');
  }
}
