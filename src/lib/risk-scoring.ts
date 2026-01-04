import { Order, RiskFactor, RiskLevel, Sentiment } from '@/types';

export interface RiskScore {
  value: number;
  level: RiskLevel;
  factors: RiskFactor[];
}

export interface RiskScoringConfig {
  silenceThresholdDays: number;
  financingPendingThresholdDays: number;
  highValueThreshold: number;
}

export const DEFAULT_CONFIG: RiskScoringConfig = {
  silenceThresholdDays: 7,
  financingPendingThresholdDays: 2,
  highValueThreshold: 200000,
};

/**
 * Calculate risk score for an order based on multiple factors.
 * Score ranges from 0-100:
 * - HIGH: >= 60
 * - MEDIUM: >= 30
 * - LOW: < 30
 */
export function calculateRiskScore(
  order: Order,
  config: RiskScoringConfig = DEFAULT_CONFIG
): RiskScore {
  let score = 0;
  const factors: RiskFactor[] = [];

  // 1. Time since last contact (max 25 points)
  const silenceScore = calculateSilenceScore(order.lastContactDaysAgo, config.silenceThresholdDays);
  if (silenceScore.impact > 0) {
    score += silenceScore.impact;
    factors.push(silenceScore);
  }

  // 2. Financing status (max 30 points)
  const financingScore = calculateFinancingScore(order, config.financingPendingThresholdDays);
  if (financingScore.impact > 0) {
    score += financingScore.impact;
    factors.push(financingScore);
  }

  // 3. Delivery delay (max 20 points)
  const deliveryScore = calculateDeliveryDelayScore(order);
  if (deliveryScore.impact > 0) {
    score += deliveryScore.impact;
    factors.push(deliveryScore);
  }

  // 4. Customer sentiment (max 15 points)
  const sentimentScore = calculateSentimentScore(order);
  if (sentimentScore.impact > 0) {
    score += sentimentScore.impact;
    factors.push(sentimentScore);
  }

  // 5. Order age without progress (max 10 points)
  const stagnationScore = calculateStagnationScore(order);
  if (stagnationScore.impact > 0) {
    score += stagnationScore.impact;
    factors.push(stagnationScore);
  }

  // Cap score at 100
  const finalScore = Math.min(100, score);

  return {
    value: finalScore,
    level: getRiskLevel(finalScore),
    factors: factors.sort((a, b) => b.impact - a.impact), // Sort by highest impact first
  };
}

/**
 * Calculate silence score based on days since last contact
 */
export function calculateSilenceScore(daysSinceContact: number, threshold: number): RiskFactor {
  if (daysSinceContact <= threshold) {
    return { factor: 'silence', impact: 0, description: '' };
  }

  const daysOverThreshold = daysSinceContact - threshold;
  const impact = Math.min(25, daysOverThreshold * 3);

  return {
    factor: 'silence',
    impact,
    description: `No contact for ${daysSinceContact} days`,
  };
}

/**
 * Calculate financing score based on pending status duration
 */
export function calculateFinancingScore(order: Order, thresholdDays: number): RiskFactor {
  if (order.financingStatus !== 'PENDING') {
    return { factor: 'financing', impact: 0, description: '' };
  }

  // Calculate days since order was last updated (proxy for financing submission)
  const updatedAt = new Date(order.updatedAt);
  const now = new Date();
  const daysPending = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

  if (daysPending <= thresholdDays) {
    return { factor: 'financing', impact: 0, description: '' };
  }

  const daysOverThreshold = daysPending - thresholdDays;
  const impact = Math.min(30, daysOverThreshold * 6);

  return {
    factor: 'financing',
    impact,
    description: `Financing pending for ${daysPending} days`,
  };
}

/**
 * Calculate delivery delay score
 */
export function calculateDeliveryDelayScore(order: Order): RiskFactor {
  if (!order.expectedDeliveryDate) {
    return { factor: 'delay', impact: 0, description: '' };
  }

  const expectedDate = new Date(order.expectedDeliveryDate);
  const now = new Date();

  // Only count as delay if we're past the expected date
  if (expectedDate >= now) {
    return { factor: 'delay', impact: 0, description: '' };
  }

  const daysDelayed = Math.floor((now.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));
  const impact = Math.min(20, daysDelayed * 4);

  return {
    factor: 'delay',
    impact,
    description: `Delivery delayed by ${daysDelayed} days`,
  };
}

/**
 * Calculate sentiment score based on latest customer sentiment
 */
export function calculateSentimentScore(order: Order): RiskFactor {
  if (!order.activities || order.activities.length === 0) {
    return { factor: 'sentiment', impact: 0, description: '' };
  }

  // Find latest activity with sentiment
  const activitiesWithSentiment = order.activities
    .filter(a => a.sentiment)
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());

  if (activitiesWithSentiment.length === 0) {
    return { factor: 'sentiment', impact: 0, description: '' };
  }

  const latestSentiment = activitiesWithSentiment[0].sentiment as Sentiment;

  if (latestSentiment === 'NEGATIVE') {
    return {
      factor: 'sentiment',
      impact: 15,
      description: 'Negative customer sentiment detected',
    };
  }

  return { factor: 'sentiment', impact: 0, description: '' };
}

/**
 * Calculate stagnation score based on order age without progress
 */
export function calculateStagnationScore(order: Order): RiskFactor {
  const createdAt = new Date(order.createdAt);
  const updatedAt = new Date(order.updatedAt);
  const now = new Date();

  // Days since last update
  const daysSinceUpdate = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

  // Only penalize if order is old and hasn't been updated
  const orderAgeDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  if (orderAgeDays < 14 || daysSinceUpdate < 5) {
    return { factor: 'stagnation', impact: 0, description: '' };
  }

  const impact = Math.min(10, Math.floor(daysSinceUpdate / 2));

  return {
    factor: 'stagnation',
    impact,
    description: `Order stagnant for ${daysSinceUpdate} days`,
  };
}

/**
 * Get risk level from score
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

/**
 * Calculate fulfillment probability (inverse of risk)
 */
export function calculateFulfillmentProbability(riskScore: number): number {
  // Simple inverse relationship: 100 - riskScore, with some floor
  return Math.max(20, 100 - riskScore);
}
