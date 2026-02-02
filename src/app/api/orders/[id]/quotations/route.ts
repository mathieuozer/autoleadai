import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, notFoundResponse, badRequestResponse } from '@/lib/api/response';
import { generateQuotationNumber, calculateQuotationTotals, validateQuotationData } from '@/lib/quotation-pdf';

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

    const quotations = await prisma.quotation.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    const transformedQuotations = quotations.map(q => ({
      ...q,
      vehiclePrice: Number(q.vehiclePrice),
      campaignDiscount: Number(q.campaignDiscount),
      additionalDiscount: Number(q.additionalDiscount),
      accessories: Number(q.accessories),
      fees: Number(q.fees),
      totalAmount: Number(q.totalAmount),
    }));

    return successResponse(transformedQuotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return serverErrorResponse('Failed to fetch quotations');
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();

    const {
      vehiclePrice,
      campaignDiscount = 0,
      additionalDiscount = 0,
      accessories = 0,
      fees = 0,
      validityDays = 7,
      issuedBy,
    } = body;

    // Validation
    if (!vehiclePrice || vehiclePrice <= 0) {
      return badRequestResponse('Valid vehicle price is required');
    }
    if (!issuedBy) {
      return badRequestResponse('Issuer ID is required');
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        vehicle: true,
      },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    // Calculate totals
    const totals = calculateQuotationTotals({
      vehiclePrice,
      campaignDiscount,
      additionalDiscount,
      accessories: Array.isArray(accessories)
        ? accessories
        : [{ name: 'Accessories', price: accessories }],
      fees: Array.isArray(fees)
        ? fees
        : [{ name: 'Processing Fee', amount: fees }],
    });

    // Validate quotation data
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    const validation = validateQuotationData({
      quotationNumber: 'temp', // Will be generated
      customer: {
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email || undefined,
      },
      vehicle: {
        brand: order.vehicle.make,
        model: order.vehicle.model,
        variant: order.vehicle.variant || '',
        year: order.vehicle.year,
        exteriorColor: order.vehicle.color || 'TBD',
        interiorColor: 'TBD',
      },
      pricing: {
        vehiclePrice,
        subtotal: totals.subtotal,
        totalAmount: totals.totalAmount,
        currency: 'AED',
      },
      validUntil,
    });

    if (!validation.valid) {
      return badRequestResponse(validation.errors.join('. '));
    }

    // Generate quotation number
    const quotationNumber = generateQuotationNumber();

    // Create quotation
    const quotation = await prisma.quotation.create({
      data: {
        orderId,
        quotationNumber,
        status: 'DRAFT',
        vehiclePrice,
        campaignDiscount,
        additionalDiscount,
        accessories: totals.accessoriesTotal,
        fees: totals.feesTotal,
        totalAmount: totals.totalAmount,
        validUntil,
        issuedBy,
        issuedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        orderId,
        type: 'NOTE',
        channel: 'SYSTEM',
        summary: `Quotation ${quotationNumber} created - AED ${totals.totalAmount.toLocaleString()}`,
        performedById: issuedBy,
        performedAt: new Date(),
      },
    });

    return successResponse({
      ...quotation,
      vehiclePrice: Number(quotation.vehiclePrice),
      campaignDiscount: Number(quotation.campaignDiscount),
      additionalDiscount: Number(quotation.additionalDiscount),
      accessories: Number(quotation.accessories),
      fees: Number(quotation.fees),
      totalAmount: Number(quotation.totalAmount),
    }, undefined, 201);
  } catch (error) {
    console.error('Error creating quotation:', error);
    return serverErrorResponse('Failed to create quotation');
  }
}
