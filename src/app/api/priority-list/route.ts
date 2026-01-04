import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse } from '@/lib/api/response';
import { calculateRiskScore, calculateFulfillmentProbability } from '@/lib/risk-scoring';
import { determineNextBestAction } from '@/lib/next-best-action';
import { Order as AppOrder, PriorityItem, RiskLevel } from '@/types';
import { Order as PrismaOrder, Customer, Vehicle, Activity, User } from '@prisma/client';

type OrderWithRelations = PrismaOrder & {
  customer: Customer;
  vehicle: Vehicle;
  activities: Activity[];
  salesperson: Pick<User, 'id' | 'name' | 'email' | 'avatar'> | null;
};

// Transform Prisma order to app Order type
function transformOrder(prismaOrder: OrderWithRelations): AppOrder {
  const lastContactDaysAgo = prismaOrder.lastContactAt
    ? Math.floor((Date.now() - new Date(prismaOrder.lastContactAt).getTime()) / (1000 * 60 * 60 * 24))
    : 30; // Default to 30 days if no contact

  return {
    id: prismaOrder.id,
    customerId: prismaOrder.customerId,
    vehicleId: prismaOrder.vehicleId,
    status: prismaOrder.status,
    source: prismaOrder.source,
    createdAt: prismaOrder.createdAt.toISOString(),
    updatedAt: prismaOrder.updatedAt.toISOString(),
    expectedDeliveryDate: prismaOrder.expectedDeliveryDate?.toISOString(),
    totalAmount: Number(prismaOrder.totalAmount),
    bookingAmount: prismaOrder.bookingAmount ? Number(prismaOrder.bookingAmount) : undefined,
    financingStatus: prismaOrder.financingStatus,
    riskScore: prismaOrder.riskScore,
    fulfillmentProbability: prismaOrder.fulfillmentProbability,
    lastContactDaysAgo,
    customer: {
      id: prismaOrder.customer.id,
      name: prismaOrder.customer.name,
      email: prismaOrder.customer.email || undefined,
      phone: prismaOrder.customer.phone,
      preferredChannel: prismaOrder.customer.preferredChannel || undefined,
    },
    vehicle: {
      id: prismaOrder.vehicle.id,
      make: prismaOrder.vehicle.make,
      model: prismaOrder.vehicle.model,
      variant: prismaOrder.vehicle.variant || undefined,
      year: prismaOrder.vehicle.year,
      color: prismaOrder.vehicle.color || undefined,
      vin: prismaOrder.vehicle.vin || undefined,
    },
    activities: prismaOrder.activities.map(a => ({
      id: a.id,
      orderId: a.orderId,
      type: a.type,
      channel: a.channel,
      summary: a.summary,
      details: a.details || undefined,
      sentiment: a.sentiment || undefined,
      performedBy: a.performedById || 'system',
      performedAt: a.performedAt.toISOString(),
      duration: a.duration || undefined,
      aiSummary: a.aiSummary || undefined,
      nextActionSuggested: a.nextActionSuggested || undefined,
    })),
    salesperson: prismaOrder.salesperson ? {
      id: prismaOrder.salesperson.id,
      name: prismaOrder.salesperson.name,
      email: prismaOrder.salesperson.email,
      role: 'SALESPERSON',
      avatar: prismaOrder.salesperson.avatar || undefined,
    } : undefined,
  };
}

// Generate priority item from order
function generatePriorityItem(order: AppOrder, rank: number): PriorityItem {
  const riskScore = calculateRiskScore(order);
  const nextBestAction = determineNextBestAction(order);

  const enrichedOrder: AppOrder = {
    ...order,
    riskScore: riskScore.value,
    fulfillmentProbability: calculateFulfillmentProbability(riskScore.value),
  };

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setHours(23, 59, 59, 999);

  return {
    id: `priority-${order.id}-${now.toISOString().split('T')[0]}`,
    orderId: order.id,
    order: enrichedOrder,
    rank,
    riskScore: riskScore.value,
    riskLevel: riskScore.level,
    riskFactors: riskScore.factors,
    nextBestAction: nextBestAction || {
      action: 'No action required',
      channel: 'SYSTEM',
      urgency: 'THIS_WEEK',
      expectedImpact: 'Order is on track',
      reasoning: 'No immediate action needed for this order.',
    },
    generatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const salespersonId = searchParams.get('salespersonId');
    const riskLevel = searchParams.get('riskLevel') as RiskLevel | null;
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    // Fetch active orders
    const where: Record<string, unknown> = {
      status: {
        notIn: ['DELIVERED', 'CANCELLED'],
      },
    };

    if (salespersonId) {
      where.salespersonId = salespersonId;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        vehicle: true,
        activities: {
          orderBy: { performedAt: 'desc' },
        },
        salesperson: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Transform and calculate risk scores
    const transformedOrders = orders.map(transformOrder);

    // Generate priority items with risk scores
    const itemsWithScores = transformedOrders.map(order => ({
      order,
      riskScore: calculateRiskScore(order),
    }));

    // Sort by risk score (highest first)
    itemsWithScores.sort((a, b) => b.riskScore.value - a.riskScore.value);

    // Generate priority items with ranks
    let priorityItems = itemsWithScores.map((item, index) =>
      generatePriorityItem(item.order, index + 1)
    );

    // Filter by risk level if specified
    if (riskLevel) {
      priorityItems = priorityItems.filter(item => item.riskLevel === riskLevel);
    }

    // Limit results
    priorityItems = priorityItems.slice(0, limit);

    // Generate summary
    const allItems = itemsWithScores.map((item, index) =>
      generatePriorityItem(item.order, index + 1)
    );

    const summary = {
      highRisk: allItems.filter(item => item.riskLevel === 'HIGH').length,
      mediumRisk: allItems.filter(item => item.riskLevel === 'MEDIUM').length,
      lowRisk: allItems.filter(item => item.riskLevel === 'LOW').length,
      totalActions: allItems.filter(item =>
        item.nextBestAction.action !== 'No action required'
      ).length,
    };

    // Calculate aggregate stats
    const totalRiskScore = allItems.reduce((sum, item) => sum + item.riskScore, 0);
    const totalFulfillment = allItems.reduce(
      (sum, item) => sum + item.order.fulfillmentProbability,
      0
    );
    const totalValue = allItems.reduce((sum, item) => sum + item.order.totalAmount, 0);
    const atRiskValue = allItems
      .filter(item => item.riskLevel === 'HIGH' || item.riskLevel === 'MEDIUM')
      .reduce((sum, item) => sum + item.order.totalAmount, 0);

    const stats = {
      averageRiskScore: allItems.length > 0 ? Math.round(totalRiskScore / allItems.length) : 0,
      averageFulfillmentProbability: allItems.length > 0 ? Math.round(totalFulfillment / allItems.length) : 100,
      totalOrderValue: totalValue,
      atRiskOrderValue: atRiskValue,
    };

    // Update risk scores in database (async, don't wait)
    updateOrderRiskScores(allItems).catch(err =>
      console.error('Error updating risk scores:', err)
    );

    const now = new Date();
    return successResponse({
      date: now.toISOString().split('T')[0],
      generatedAt: now.toISOString(),
      summary,
      stats,
      items: priorityItems,
    });
  } catch (error) {
    console.error('Error generating priority list:', error);
    return serverErrorResponse('Failed to generate priority list');
  }
}

// Update order risk scores in the database
async function updateOrderRiskScores(items: PriorityItem[]) {
  const updates = items.map(item =>
    prisma.order.update({
      where: { id: item.orderId },
      data: {
        riskScore: item.riskScore,
        riskLevel: item.riskLevel,
        fulfillmentProbability: item.order.fulfillmentProbability,
      },
    })
  );

  await Promise.all(updates);
}
