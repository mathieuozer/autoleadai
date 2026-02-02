import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, badRequestResponse } from '@/lib/api/response';
import { FINANCING_BANKS, calculateFinancing, getRequiredDocuments } from '@/lib/financing';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'banks';

    if (type === 'banks') {
      // Return available financing banks
      return successResponse(FINANCING_BANKS);
    }

    if (type === 'calculate') {
      // Calculate financing details
      const vehiclePrice = parseFloat(searchParams.get('vehiclePrice') || '0');
      const downPaymentPercent = parseFloat(searchParams.get('downPaymentPercent') || '20');
      const interestRate = parseFloat(searchParams.get('interestRate') || '3.5');
      const termMonths = parseInt(searchParams.get('termMonths') || '48');

      if (vehiclePrice <= 0) {
        return badRequestResponse('Valid vehicle price is required');
      }

      const calculation = calculateFinancing(
        vehiclePrice,
        downPaymentPercent,
        interestRate,
        termMonths
      );

      return successResponse(calculation);
    }

    if (type === 'documents') {
      // Get required documents based on customer type
      const customerType = searchParams.get('customerType') as 'salaried' | 'self_employed' | 'company' || 'salaried';
      const documents = getRequiredDocuments(customerType);
      return successResponse(documents);
    }

    if (type === 'compare') {
      // Compare financing options across banks
      const vehiclePrice = parseFloat(searchParams.get('vehiclePrice') || '0');
      const downPaymentPercent = parseFloat(searchParams.get('downPaymentPercent') || '20');
      const termMonths = parseInt(searchParams.get('termMonths') || '48');

      if (vehiclePrice <= 0) {
        return badRequestResponse('Valid vehicle price is required');
      }

      const comparisons = FINANCING_BANKS.map(bank => {
        const calculation = calculateFinancing(
          vehiclePrice,
          Math.max(downPaymentPercent, bank.minDownPayment),
          (bank.interestRateFrom + bank.interestRateTo) / 2,
          Math.min(termMonths, bank.maxTerm)
        );

        return {
          bank: {
            id: bank.id,
            name: bank.name,
            features: bank.features,
            approvalTime: bank.approvalTime
          },
          calculation,
          effectiveDownPayment: Math.max(downPaymentPercent, bank.minDownPayment),
          effectiveTerm: Math.min(termMonths, bank.maxTerm)
        };
      });

      // Sort by lowest monthly payment
      comparisons.sort((a, b) => a.calculation.monthlyPayment - b.calculation.monthlyPayment);

      return successResponse({
        vehiclePrice,
        requestedDownPayment: downPaymentPercent,
        requestedTerm: termMonths,
        comparisons
      });
    }

    return badRequestResponse('Invalid type parameter');
  } catch (error) {
    console.error('Error fetching financing data:', error);
    return serverErrorResponse('Failed to fetch financing data');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      orderId,
      type, // CASH, BANK_FINANCE, IN_HOUSE_FINANCE, LEASE
      vehiclePrice,
      downPayment,
      bankId,
      termMonths,
      interestRate,
      customerType
    } = body;

    // Validation
    if (!orderId) {
      return badRequestResponse('Order ID is required');
    }
    if (!type) {
      return badRequestResponse('Financing type is required');
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });

    if (!order) {
      return badRequestResponse('Order not found');
    }

    // For cash, just update order
    if (type === 'CASH') {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          financingStatus: 'CASH'
        }
      });

      return successResponse({
        type: 'CASH',
        message: 'Cash payment confirmed'
      }, undefined, 201);
    }

    // Calculate financing
    const calculation = calculateFinancing(
      vehiclePrice,
      (downPayment / vehiclePrice) * 100,
      interestRate,
      termMonths
    );

    // Get bank details if bank finance
    const bank = bankId ? FINANCING_BANKS.find(b => b.id === bankId) : null;

    // Get required documents
    const documents = getRequiredDocuments(customerType || 'salaried');

    // Update order financing status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        financingStatus: 'PENDING'
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        orderId,
        type: 'NOTE',
        channel: 'SYSTEM',
        summary: `Financing application started - ${type}${bank ? ` with ${bank.name}` : ''}`,
        performedAt: new Date()
      }
    });

    return successResponse({
      type,
      bank: bank ? { id: bank.id, name: bank.name } : null,
      calculation,
      documentsRequired: documents,
      status: 'DOCUMENTS_PENDING',
      nextStep: 'Upload required documents to proceed with the application'
    }, undefined, 201);
  } catch (error) {
    console.error('Error creating financing application:', error);
    return serverErrorResponse('Failed to create financing application');
  }
}
