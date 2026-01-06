import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  successResponse,
  serverErrorResponse,
  badRequestResponse,
  notFoundResponse,
} from '@/lib/api/response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/trade-ins/:id/respond - Accept or reject tentative price
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { action, counterOffer, reason } = body;

    if (!action || !['accept', 'reject'].includes(action)) {
      return badRequestResponse('Action must be "accept" or "reject"');
    }

    // Get the appraisal
    const appraisal = await prisma.tradeInAppraisal.findUnique({
      where: { id },
      include: {
        customer: true,
        salesExecutive: {
          select: { id: true, name: true },
        },
        inspector: {
          select: { id: true, name: true },
        },
      },
    });

    if (!appraisal) {
      return notFoundResponse('Trade-in appraisal not found');
    }

    if (appraisal.status !== 'PRICED') {
      return badRequestResponse('Can only respond to appraisals with PRICED status');
    }

    const vehicleInfo = [
      appraisal.ocrRegistrationYear,
      appraisal.ocrVehicleMake,
      appraisal.ocrVehicleModel,
    ].filter(Boolean).join(' ') || 'Vehicle';

    if (action === 'accept') {
      // Accept the price
      const updated = await prisma.tradeInAppraisal.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
        },
        include: {
          customer: true,
          salesExecutive: { select: { id: true, name: true } },
          inspector: { select: { id: true, name: true } },
        },
      });

      // Notify inspector that price was accepted
      if (appraisal.inspectorId) {
        await prisma.notification.create({
          data: {
            userId: appraisal.inspectorId,
            type: 'TRADE_IN_ACCEPTED',
            title: 'Price Accepted',
            message: `${appraisal.salesExecutive.name} accepted AED ${Number(appraisal.tentativePrice).toLocaleString()} for ${vehicleInfo}`,
            link: `/trade-in/review/${id}`,
            referenceId: id,
            referenceType: 'trade-in',
          },
        });
      }

      return successResponse({
        ...updated,
        tentativePrice: updated.tentativePrice ? Number(updated.tentativePrice) : null,
        expectedPrice: updated.expectedPrice ? Number(updated.expectedPrice) : null,
      });
    } else {
      // Reject the price
      const updateData: {
        status: 'REJECTED';
        additionalNotes?: string;
      } = {
        status: 'REJECTED',
      };

      // If counter-offer provided, store it in notes for now
      if (counterOffer || reason) {
        const rejectNote = [
          reason ? `Rejection reason: ${reason}` : null,
          counterOffer ? `Counter-offer: AED ${Number(counterOffer).toLocaleString()}` : null,
        ].filter(Boolean).join('. ');

        updateData.additionalNotes = appraisal.additionalNotes
          ? `${appraisal.additionalNotes}\n\n[Sales Response] ${rejectNote}`
          : `[Sales Response] ${rejectNote}`;
      }

      const updated = await prisma.tradeInAppraisal.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          salesExecutive: { select: { id: true, name: true } },
          inspector: { select: { id: true, name: true } },
        },
      });

      // Notify inspector that price was rejected
      if (appraisal.inspectorId) {
        const rejectMessage = counterOffer
          ? `${appraisal.salesExecutive.name} rejected AED ${Number(appraisal.tentativePrice).toLocaleString()} for ${vehicleInfo}. Counter-offer: AED ${Number(counterOffer).toLocaleString()}`
          : `${appraisal.salesExecutive.name} rejected AED ${Number(appraisal.tentativePrice).toLocaleString()} for ${vehicleInfo}`;

        await prisma.notification.create({
          data: {
            userId: appraisal.inspectorId,
            type: 'TRADE_IN_REJECTED',
            title: 'Price Rejected',
            message: rejectMessage,
            link: `/trade-in/review/${id}`,
            referenceId: id,
            referenceType: 'trade-in',
          },
        });
      }

      return successResponse({
        ...updated,
        tentativePrice: updated.tentativePrice ? Number(updated.tentativePrice) : null,
        expectedPrice: updated.expectedPrice ? Number(updated.expectedPrice) : null,
      });
    }
  } catch (error) {
    console.error('Error responding to price:', error);
    return serverErrorResponse('Failed to respond to price');
  }
}
