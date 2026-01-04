import { Order, PriorityItem, PriorityList, PriorityListSummary, RiskLevel } from '@/types';
import { calculateRiskScore, calculateFulfillmentProbability, RiskScore } from './risk-scoring';
import { determineNextBestAction } from './next-best-action';

/**
 * Generate a priority item from an order
 */
export function generatePriorityItem(order: Order, rank: number): PriorityItem {
  const riskScore = calculateRiskScore(order);
  const nextBestAction = determineNextBestAction(order);

  // Update order with calculated values
  const enrichedOrder: Order = {
    ...order,
    riskScore: riskScore.value,
    fulfillmentProbability: calculateFulfillmentProbability(riskScore.value),
  };

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setHours(23, 59, 59, 999); // Expires at end of day

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

/**
 * Sort orders by risk score (highest first) and generate ranked priority items
 */
export function generatePriorityItems(orders: Order[]): PriorityItem[] {
  // Filter out delivered and cancelled orders
  const activeOrders = orders.filter(
    order => order.status !== 'DELIVERED' && order.status !== 'CANCELLED'
  );

  // Calculate risk scores and sort
  const ordersWithScores = activeOrders.map(order => ({
    order,
    riskScore: calculateRiskScore(order),
  }));

  // Sort by risk score (highest first)
  ordersWithScores.sort((a, b) => b.riskScore.value - a.riskScore.value);

  // Generate priority items with ranks
  return ordersWithScores.map((item, index) =>
    generatePriorityItem(item.order, index + 1)
  );
}

/**
 * Generate summary statistics for the priority list
 */
export function generateSummary(items: PriorityItem[]): PriorityListSummary {
  const highRisk = items.filter(item => item.riskLevel === 'HIGH').length;
  const mediumRisk = items.filter(item => item.riskLevel === 'MEDIUM').length;
  const lowRisk = items.filter(item => item.riskLevel === 'LOW').length;
  const totalActions = items.filter(item =>
    item.nextBestAction.action !== 'No action required'
  ).length;

  return {
    highRisk,
    mediumRisk,
    lowRisk,
    totalActions,
  };
}

/**
 * Generate a complete priority list for a set of orders
 */
export function generatePriorityList(orders: Order[]): PriorityList {
  const now = new Date();
  const items = generatePriorityItems(orders);
  const summary = generateSummary(items);

  return {
    date: now.toISOString().split('T')[0],
    generatedAt: now.toISOString(),
    summary,
    items,
  };
}

/**
 * Filter priority items by risk level
 */
export function filterByRiskLevel(items: PriorityItem[], level: RiskLevel): PriorityItem[] {
  return items.filter(item => item.riskLevel === level);
}

/**
 * Get top N priority items
 */
export function getTopPriorityItems(items: PriorityItem[], n: number): PriorityItem[] {
  return items.slice(0, n);
}

/**
 * Get items that need immediate action (NOW urgency)
 */
export function getImmediateActions(items: PriorityItem[]): PriorityItem[] {
  return items.filter(item => item.nextBestAction.urgency === 'NOW');
}

/**
 * Get items for today's actions (NOW or TODAY urgency)
 */
export function getTodayActions(items: PriorityItem[]): PriorityItem[] {
  return items.filter(
    item => item.nextBestAction.urgency === 'NOW' || item.nextBestAction.urgency === 'TODAY'
  );
}

/**
 * Calculate aggregate statistics
 */
export function calculateAggregateStats(items: PriorityItem[]): {
  averageRiskScore: number;
  averageFulfillmentProbability: number;
  totalOrderValue: number;
  atRiskOrderValue: number;
} {
  if (items.length === 0) {
    return {
      averageRiskScore: 0,
      averageFulfillmentProbability: 100,
      totalOrderValue: 0,
      atRiskOrderValue: 0,
    };
  }

  const totalRiskScore = items.reduce((sum, item) => sum + item.riskScore, 0);
  const totalFulfillment = items.reduce(
    (sum, item) => sum + item.order.fulfillmentProbability,
    0
  );
  const totalValue = items.reduce((sum, item) => sum + item.order.totalAmount, 0);
  const atRiskValue = items
    .filter(item => item.riskLevel === 'HIGH' || item.riskLevel === 'MEDIUM')
    .reduce((sum, item) => sum + item.order.totalAmount, 0);

  return {
    averageRiskScore: Math.round(totalRiskScore / items.length),
    averageFulfillmentProbability: Math.round(totalFulfillment / items.length),
    totalOrderValue: totalValue,
    atRiskOrderValue: atRiskValue,
  };
}
