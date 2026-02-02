import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, badRequestResponse } from '@/lib/api/response';
import { OrderStatus, RiskLevel, OrderSource } from '@prisma/client';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const {
      customerId,
      vehicleId,
      source,
      totalAmount,
      variantId,
      exteriorColorId,
      interiorColorId,
      salespersonId,
      expectedDeliveryDate,
      bookingAmount,
    } = body;

    if (!customerId) {
      return badRequestResponse('Customer ID is required');
    }
    if (!vehicleId) {
      return badRequestResponse('Vehicle ID is required');
    }
    if (!source || !Object.values(OrderSource).includes(source)) {
      return badRequestResponse('Valid source is required');
    }
    if (!totalAmount || totalAmount <= 0) {
      return badRequestResponse('Valid total amount is required');
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return badRequestResponse('Customer not found');
    }

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      return badRequestResponse('Vehicle not found');
    }

    // Verify variant if provided
    if (variantId) {
      const variant = await prisma.vehicleVariant.findUnique({
        where: { id: variantId },
      });
      if (!variant) {
        return badRequestResponse('Variant not found');
      }
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        customerId,
        vehicleId,
        source,
        totalAmount,
        bookingAmount: bookingAmount || null,
        salespersonId: salespersonId || null,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
        variantId: variantId || null,
        exteriorColorId: exteriorColorId || null,
        interiorColorId: interiorColorId || null,
        status: 'NEW',
        riskLevel: 'LOW',
        riskScore: 0,
        fulfillmentProbability: 100,
      },
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
      },
    });

    // Create initial activity
    await prisma.activity.create({
      data: {
        orderId: order.id,
        type: 'STATUS_CHANGE',
        channel: 'SYSTEM',
        summary: `Order created from ${source}`,
        performedById: salespersonId || null,
        performedAt: new Date(),
      },
    });

    return successResponse({
      ...order,
      totalAmount: Number(order.totalAmount),
      bookingAmount: order.bookingAmount ? Number(order.bookingAmount) : null,
    }, undefined, 201);
  } catch (error) {
    console.error('Error creating order:', error);
    return serverErrorResponse('Failed to create order');
  }
}
