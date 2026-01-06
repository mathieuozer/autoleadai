import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  successResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api/response';

// GET /api/customers - List customers
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
    const skip = (page - 1) * pageSize;

    // Search
    const search = searchParams.get('search');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute queries
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.customer.count({ where }),
    ]);

    return successResponse(customers, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return serverErrorResponse('Failed to fetch customers');
  }
}

// POST /api/customers - Create a new customer (walk-in)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, phone, email, preferredChannel } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return badRequestResponse('Customer name is required');
    }

    if (!phone || !phone.trim()) {
      return badRequestResponse('Phone number is required');
    }

    // Check if customer with same phone exists
    const existing = await prisma.customer.findFirst({
      where: { phone: phone.trim() },
    });

    if (existing) {
      return badRequestResponse('Customer with this phone number already exists', {
        existingCustomerId: existing.id,
      });
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        preferredChannel: preferredChannel || 'WHATSAPP',
      },
    });

    return successResponse(customer, undefined, 201);
  } catch (error) {
    console.error('Error creating customer:', error);
    return serverErrorResponse('Failed to create customer');
  }
}
