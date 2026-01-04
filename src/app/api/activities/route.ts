import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, badRequestResponse } from '@/lib/api/response';
import { ActivityType, Channel, Sentiment } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
    const skip = (page - 1) * pageSize;

    // Filters
    const orderId = searchParams.get('orderId');
    const type = searchParams.get('type') as ActivityType | null;
    const channel = searchParams.get('channel') as Channel | null;

    const where: Record<string, unknown> = {};

    if (orderId) {
      where.orderId = orderId;
    }

    if (type) {
      if (!Object.values(ActivityType).includes(type)) {
        return badRequestResponse(`Invalid activity type: ${type}`);
      }
      where.type = type;
    }

    if (channel) {
      if (!Object.values(Channel).includes(channel)) {
        return badRequestResponse(`Invalid channel: ${channel}`);
      }
      where.channel = channel;
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              customer: {
                select: { name: true },
              },
              vehicle: {
                select: { make: true, model: true },
              },
            },
          },
          performedBy: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { performedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.activity.count({ where }),
    ]);

    return successResponse(activities, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return serverErrorResponse('Failed to fetch activities');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.orderId) {
      return badRequestResponse('orderId is required');
    }

    if (!body.type) {
      return badRequestResponse('type is required');
    }

    if (!Object.values(ActivityType).includes(body.type)) {
      return badRequestResponse(`Invalid activity type: ${body.type}`);
    }

    if (!body.channel) {
      return badRequestResponse('channel is required');
    }

    if (!Object.values(Channel).includes(body.channel)) {
      return badRequestResponse(`Invalid channel: ${body.channel}`);
    }

    if (!body.summary) {
      return badRequestResponse('summary is required');
    }

    // Validate sentiment if provided
    if (body.sentiment && !Object.values(Sentiment).includes(body.sentiment)) {
      return badRequestResponse(`Invalid sentiment: ${body.sentiment}`);
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: body.orderId },
    });

    if (!order) {
      return badRequestResponse('Order not found');
    }

    // Create activity
    const activity = await prisma.activity.create({
      data: {
        orderId: body.orderId,
        type: body.type,
        channel: body.channel,
        summary: body.summary,
        details: body.details,
        sentiment: body.sentiment,
        performedById: body.performedById,
        performedAt: body.performedAt ? new Date(body.performedAt) : new Date(),
        duration: body.duration,
      },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Update order's lastContactAt for customer-facing activities
    const customerFacingTypes: ActivityType[] = [
      'CALL_OUTBOUND',
      'CALL_INBOUND',
      'WHATSAPP_SENT',
      'WHATSAPP_RECEIVED',
      'EMAIL_SENT',
      'EMAIL_RECEIVED',
      'VISIT',
      'TEST_DRIVE',
    ];

    if (customerFacingTypes.includes(body.type)) {
      await prisma.order.update({
        where: { id: body.orderId },
        data: { lastContactAt: activity.performedAt },
      });
    }

    return successResponse(activity, undefined, 201);
  } catch (error) {
    console.error('Error creating activity:', error);
    return serverErrorResponse('Failed to create activity');
  }
}
