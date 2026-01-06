import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  successResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api/response';
import { TradeInStatus } from '@prisma/client';

// GET /api/trade-ins - List trade-in appraisals
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
    const skip = (page - 1) * pageSize;

    // Filters
    const status = searchParams.get('status') as TradeInStatus | null;
    const salesExecutiveId = searchParams.get('salesExecutiveId');
    const customerId = searchParams.get('customerId');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) {
      if (!Object.values(TradeInStatus).includes(status)) {
        return badRequestResponse(`Invalid status: ${status}`);
      }
      where.status = status;
    }

    if (salesExecutiveId) {
      where.salesExecutiveId = salesExecutiveId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    // Execute queries
    const [appraisals, total] = await Promise.all([
      prisma.tradeInAppraisal.findMany({
        where,
        include: {
          customer: true,
          salesExecutive: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          photos: {
            select: {
              id: true,
              type: true,
              url: true,
              thumbnail: true,
            },
          },
          inspector: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.tradeInAppraisal.count({ where }),
    ]);

    // Transform decimal fields
    const transformedAppraisals = appraisals.map((appraisal) => ({
      ...appraisal,
      expectedPrice: appraisal.expectedPrice ? Number(appraisal.expectedPrice) : null,
      tentativePrice: appraisal.tentativePrice ? Number(appraisal.tentativePrice) : null,
    }));

    return successResponse(transformedAppraisals, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching trade-in appraisals:', error);
    return serverErrorResponse('Failed to fetch trade-in appraisals');
  }
}

// POST /api/trade-ins - Create new trade-in appraisal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { customerId, salesExecutiveId, leadId } = body;

    // Validate required fields
    if (!customerId) {
      return badRequestResponse('customerId is required');
    }

    if (!salesExecutiveId) {
      return badRequestResponse('salesExecutiveId is required');
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return badRequestResponse('Customer not found');
    }

    // Verify sales executive exists
    const salesExecutive = await prisma.user.findUnique({
      where: { id: salesExecutiveId },
    });

    if (!salesExecutive) {
      return badRequestResponse('Sales executive not found');
    }

    // Create appraisal
    const appraisal = await prisma.tradeInAppraisal.create({
      data: {
        customerId,
        salesExecutiveId,
        leadId: leadId || null,
        status: 'DRAFT',
      },
      include: {
        customer: true,
        salesExecutive: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return successResponse(appraisal, undefined, 201);
  } catch (error) {
    console.error('Error creating trade-in appraisal:', error);
    return serverErrorResponse('Failed to create trade-in appraisal');
  }
}
