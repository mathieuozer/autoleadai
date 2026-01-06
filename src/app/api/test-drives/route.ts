import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  successResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api/response';
import { TestDriveStatus } from '@prisma/client';

// GET /api/test-drives - List test drives
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
    const skip = (page - 1) * pageSize;

    // Filters
    const status = searchParams.get('status') as TestDriveStatus | null;
    const salesExecutiveId = searchParams.get('salesExecutiveId');
    const customerId = searchParams.get('customerId');
    const vehicleId = searchParams.get('vehicleId');
    const date = searchParams.get('date'); // YYYY-MM-DD format

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) {
      if (!Object.values(TestDriveStatus).includes(status)) {
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

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.scheduledDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Execute queries
    const [testDrives, total] = await Promise.all([
      prisma.testDrive.findMany({
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
          vehicle: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.testDrive.count({ where }),
    ]);

    return successResponse(testDrives, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching test drives:', error);
    return serverErrorResponse('Failed to fetch test drives');
  }
}

// POST /api/test-drives - Create new test drive
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { customerId, salesExecutiveId, vehicleId, orderId } = body;

    // Validate required fields
    if (!customerId) {
      return badRequestResponse('customerId is required');
    }

    if (!salesExecutiveId) {
      return badRequestResponse('salesExecutiveId is required');
    }

    if (!vehicleId) {
      return badRequestResponse('vehicleId is required');
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

    // Verify vehicle exists and is available for test drives
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return badRequestResponse('Vehicle not found');
    }

    if (!vehicle.testDriveAvailable) {
      return badRequestResponse('Vehicle is not available for test drives');
    }

    // Create test drive
    const testDrive = await prisma.testDrive.create({
      data: {
        customerId,
        salesExecutiveId,
        vehicleId,
        orderId: orderId || null,
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
        vehicle: true,
      },
    });

    return successResponse(testDrive, undefined, 201);
  } catch (error) {
    console.error('Error creating test drive:', error);
    return serverErrorResponse('Failed to create test drive');
  }
}
