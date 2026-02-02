import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, badRequestResponse } from '@/lib/api/response';
import { DiscountStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
    const skip = (page - 1) * pageSize;

    // Filters
    const status = searchParams.get('status') as DiscountStatus | null;
    const approverRole = searchParams.get('approverRole');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) {
      if (!Object.values(DiscountStatus).includes(status)) {
        return badRequestResponse(`Invalid status: ${status}`);
      }
      where.status = status;
    } else {
      // Default: show pending items
      where.status = { in: ['PENDING_BM', 'PENDING_GM'] };
    }

    // Filter by approver role
    if (approverRole === 'BRANCH_MANAGER') {
      where.status = 'PENDING_BM';
    } else if (approverRole === 'ADMIN') {
      where.status = 'PENDING_GM';
    }

    // Execute queries
    const [discounts, total] = await Promise.all([
      prisma.discountRequest.findMany({
        where,
        include: {
          order: {
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
          },
        },
        orderBy: { requestedAt: 'asc' }, // Oldest first
        skip,
        take: pageSize,
      }),
      prisma.discountRequest.count({ where }),
    ]);

    // Transform
    const transformedDiscounts = discounts.map(d => ({
      ...d,
      originalPrice: Number(d.originalPrice),
      campaignDiscount: Number(d.campaignDiscount),
      requestedDiscount: Number(d.requestedDiscount),
      finalPrice: Number(d.finalPrice),
      discountPercentage: Math.round((Number(d.requestedDiscount) / Number(d.originalPrice)) * 100),
      waitingDays: Math.floor((Date.now() - new Date(d.requestedAt).getTime()) / (1000 * 60 * 60 * 24)),
      order: {
        ...d.order,
        totalAmount: Number(d.order.totalAmount),
        bookingAmount: d.order.bookingAmount ? Number(d.order.bookingAmount) : null,
      },
    }));

    // Summary stats
    const stats = {
      pendingBM: await prisma.discountRequest.count({ where: { status: 'PENDING_BM' } }),
      pendingGM: await prisma.discountRequest.count({ where: { status: 'PENDING_GM' } }),
      totalPendingValue: transformedDiscounts.reduce((sum, d) => sum + d.requestedDiscount, 0),
    };

    return successResponse(
      {
        discounts: transformedDiscounts,
        stats,
      },
      {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      }
    );
  } catch (error) {
    console.error('Error fetching pending discounts:', error);
    return serverErrorResponse('Failed to fetch pending discounts');
  }
}
