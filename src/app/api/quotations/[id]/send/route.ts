import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, notFoundResponse, badRequestResponse } from '@/lib/api/response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { channel = 'email', sentBy } = body;

    // Find quotation
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            vehicle: true,
          },
        },
      },
    });

    if (!quotation) {
      return notFoundResponse('Quotation not found');
    }

    if (quotation.status === 'DRAFT') {
      return badRequestResponse('Quotation must be issued before sending');
    }

    if (quotation.status === 'CANCELLED' || quotation.status === 'EXPIRED') {
      return badRequestResponse(`Cannot send a ${quotation.status.toLowerCase()} quotation`);
    }

    // Check validity
    if (new Date(quotation.validUntil) <= new Date()) {
      // Auto-expire
      await prisma.quotation.update({
        where: { id },
        data: { status: 'EXPIRED' },
      });
      return badRequestResponse('Quotation has expired. Please create a new quotation.');
    }

    // Validate customer contact
    const customer = quotation.order.customer;
    if (channel === 'email' && !customer.email) {
      return badRequestResponse('Customer does not have an email address');
    }
    if (channel === 'whatsapp' && !customer.phone) {
      return badRequestResponse('Customer does not have a phone number');
    }

    // Update status to SENT
    const updatedQuotation = await prisma.quotation.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // TODO: Integrate with email/WhatsApp service
    // if (channel === 'email') {
    //   await sendQuotationEmail(customer.email, quotation);
    // } else if (channel === 'whatsapp') {
    //   await sendQuotationWhatsApp(customer.phone, quotation);
    // }

    // Log activity
    await prisma.activity.create({
      data: {
        orderId: quotation.orderId,
        type: 'EMAIL_SENT',
        channel: channel === 'email' ? 'EMAIL' : 'WHATSAPP',
        summary: `Quotation ${quotation.quotationNumber} sent to ${customer.name}`,
        performedById: sentBy || null,
        performedAt: new Date(),
      },
    });

    // Notify salesperson
    await prisma.notification.create({
      data: {
        userId: quotation.order.salespersonId || quotation.issuedBy,
        type: 'SYSTEM',
        title: 'Quotation Sent',
        message: `Quotation ${quotation.quotationNumber} was sent to ${customer.name}`,
        referenceId: quotation.orderId,
        referenceType: 'order',
        link: `/orders/${quotation.orderId}`,
      },
    });

    return successResponse({
      ...updatedQuotation,
      vehiclePrice: Number(updatedQuotation.vehiclePrice),
      campaignDiscount: Number(updatedQuotation.campaignDiscount),
      additionalDiscount: Number(updatedQuotation.additionalDiscount),
      accessories: Number(updatedQuotation.accessories),
      fees: Number(updatedQuotation.fees),
      totalAmount: Number(updatedQuotation.totalAmount),
      sentVia: channel,
      sentTo: channel === 'email' ? customer.email : customer.phone,
    });
  } catch (error) {
    console.error('Error sending quotation:', error);
    return serverErrorResponse('Failed to send quotation');
  }
}
