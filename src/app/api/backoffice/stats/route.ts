import { prisma, OrderStatus, RiskLevel } from '@/lib/db';
import { successResponse, serverErrorResponse } from '@/lib/api/response';

// GET /api/backoffice/stats
// Returns aggregate stats for back office dashboard
export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Active orders (not delivered or cancelled)
    const activeStatuses: OrderStatus[] = [
      OrderStatus.NEW,
      OrderStatus.CONTACTED,
      OrderStatus.TEST_DRIVE_SCHEDULED,
      OrderStatus.TEST_DRIVE_DONE,
      OrderStatus.NEGOTIATION,
      OrderStatus.BOOKING_DONE,
      OrderStatus.FINANCING_PENDING,
      OrderStatus.FINANCING_APPROVED,
      OrderStatus.READY_FOR_DELIVERY,
    ];

    const [
      totalActiveOrders,
      lastWeekActiveOrders,
      atRiskOrders,
      deliveriesToday,
      completedDeliveriesToday,
    ] = await Promise.all([
      // Total active orders now
      prisma.order.count({
        where: { status: { in: activeStatuses } },
      }),
      // Active orders one week ago (approximation using createdAt)
      prisma.order.count({
        where: {
          status: { in: activeStatuses },
          createdAt: { lte: oneWeekAgo },
        },
      }),
      // At-risk orders (HIGH risk level)
      prisma.order.count({
        where: {
          status: { in: activeStatuses },
          riskLevel: RiskLevel.HIGH,
        },
      }),
      // Deliveries scheduled for today
      prisma.order.count({
        where: {
          status: OrderStatus.READY_FOR_DELIVERY,
          expectedDeliveryDate: {
            gte: startOfToday,
            lt: endOfToday,
          },
        },
      }),
      // Completed deliveries today
      prisma.order.count({
        where: {
          status: OrderStatus.DELIVERED,
          deliveredAt: {
            gte: startOfToday,
            lt: endOfToday,
          },
        },
      }),
    ]);

    // Calculate SLA compliance (orders not overdue)
    // An order is overdue if it's been in certain statuses too long
    const slaLimits: Record<string, number> = {
      BOOKING_DONE: 2,        // 2 days to process documents
      FINANCING_PENDING: 3,   // 3 days for financing
      FINANCING_APPROVED: 2,  // 2 days to allocate vehicle
      READY_FOR_DELIVERY: 1,  // 1 day to deliver
    };

    const slaStatuses: OrderStatus[] = [
      OrderStatus.BOOKING_DONE,
      OrderStatus.FINANCING_PENDING,
      OrderStatus.FINANCING_APPROVED,
      OrderStatus.READY_FOR_DELIVERY,
    ];

    const ordersWithSlaStatuses = await prisma.order.findMany({
      where: {
        status: { in: slaStatuses },
      },
      select: {
        status: true,
        updatedAt: true,
      },
    });

    let overdueCount = 0;
    for (const order of ordersWithSlaStatuses) {
      const limit = slaLimits[order.status] || 3;
      const daysInStatus = Math.floor(
        (now.getTime() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysInStatus > limit) {
        overdueCount++;
      }
    }

    const totalSlaOrders = ordersWithSlaStatuses.length;
    const slaCompliance = totalSlaOrders > 0
      ? Math.round(((totalSlaOrders - overdueCount) / totalSlaOrders) * 100)
      : 100;

    // Calculate trends
    const activeOrdersTrend = totalActiveOrders - lastWeekActiveOrders;
    const activeOrdersTrendPercent = lastWeekActiveOrders > 0
      ? Math.round((activeOrdersTrend / lastWeekActiveOrders) * 100)
      : 0;

    return successResponse({
      totalActiveOrders: {
        value: totalActiveOrders,
        trend: {
          value: Math.abs(activeOrdersTrendPercent),
          direction: activeOrdersTrend >= 0 ? 'up' : 'down',
          label: 'vs last week',
        },
      },
      slaCompliance: {
        value: slaCompliance,
        trend: {
          value: 3, // Placeholder - would need historical data
          direction: 'up',
          label: 'vs last week',
        },
      },
      atRiskOrders: {
        value: atRiskOrders,
        subtitle: 'Need attention',
      },
      deliveriesToday: {
        value: deliveriesToday,
        subtitle: `${completedDeliveriesToday} completed`,
      },
    });
  } catch (error) {
    console.error('Error fetching backoffice stats:', error);
    return serverErrorResponse('Failed to fetch stats');
  }
}
