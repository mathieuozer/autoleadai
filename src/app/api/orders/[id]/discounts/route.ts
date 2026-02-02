import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, notFoundResponse, badRequestResponse } from '@/lib/api/response';
import { getRequiredApprovalLevel, validateDiscountRequest } from '@/lib/discount-rules';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params;

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    const discounts = await prisma.discountRequest.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    const transformedDiscounts = discounts.map(d => ({
      ...d,
      originalPrice: Number(d.originalPrice),
      campaignDiscount: Number(d.campaignDiscount),
      requestedDiscount: Number(d.requestedDiscount),
      finalPrice: Number(d.finalPrice),
    }));

    return successResponse(transformedDiscounts);
  } catch (error) {
    console.error('Error fetching discounts:', error);
    return serverErrorResponse('Failed to fetch discounts');
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();

    const {
      originalPrice,
      campaignDiscount = 0,
      requestedDiscount,
      justification,
      requestedBy,
      brandCode, // Optional: for brand-specific rules
    } = body;

    // Validation
    if (!originalPrice || originalPrice <= 0) {
      return badRequestResponse('Valid original price is required');
    }
    if (!requestedDiscount || requestedDiscount <= 0) {
      return badRequestResponse('Valid requested discount is required');
    }
    if (!justification || justification.trim().length < 10) {
      return badRequestResponse('Justification must be at least 10 characters');
    }
    if (!requestedBy) {
      return badRequestResponse('Requester ID is required');
    }

    // Validate discount request
    const validation = validateDiscountRequest(requestedDiscount, originalPrice);
    if (!validation.valid) {
      return badRequestResponse(validation.errors.join('. '));
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        discountRequests: {
          where: {
            status: { in: ['DRAFT', 'PENDING_BM', 'PENDING_GM'] },
          },
        },
      },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    // Check for existing pending discount request
    if (order.discountRequests.length > 0) {
      return badRequestResponse('There is already a pending discount request for this order');
    }

    // Calculate final price and required approval level
    const finalPrice = originalPrice - campaignDiscount - requestedDiscount;
    const requiredLevel = getRequiredApprovalLevel(requestedDiscount, brandCode);

    // Create discount request
    const discount = await prisma.discountRequest.create({
      data: {
        orderId,
        status: 'PENDING_BM', // Always starts with BM
        originalPrice,
        campaignDiscount,
        requestedDiscount,
        finalPrice,
        justification,
        currentLevel: 0, // Not yet approved by anyone
        requiredLevel,
        requestedBy,
        requestedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        orderId,
        type: 'NOTE',
        channel: 'SYSTEM',
        summary: `Discount request submitted: AED ${requestedDiscount} (${Math.round((requestedDiscount / originalPrice) * 100)}% off)`,
        performedById: requestedBy,
        performedAt: new Date(),
      },
    });

    // Create notification for Branch Manager
    // In a real app, we'd find the BM for this branch
    await prisma.notification.create({
      data: {
        userId: 'branch-manager', // Placeholder - would be actual BM user ID
        type: 'SYSTEM',
        title: 'Discount Approval Required',
        message: `A discount request of AED ${requestedDiscount} requires your approval`,
        referenceId: discount.id,
        referenceType: 'discount',
        link: `/approvals/discounts?id=${discount.id}`,
      },
    });

    return successResponse({
      ...discount,
      originalPrice: Number(discount.originalPrice),
      campaignDiscount: Number(discount.campaignDiscount),
      requestedDiscount: Number(discount.requestedDiscount),
      finalPrice: Number(discount.finalPrice),
      warnings: validation.warnings,
    }, undefined, 201);
  } catch (error) {
    console.error('Error creating discount request:', error);
    return serverErrorResponse('Failed to create discount request');
  }
}
