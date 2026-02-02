/**
 * Stock Intelligence Scoring Algorithms
 *
 * Calculates aging risk, closeability scores, and priority rankings for inventory.
 */

export interface StockAgingScore {
  score: number;           // 0-100, higher = more at-risk
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  daysInStock: number;
  factors: StockRiskFactor[];
}

export interface StockRiskFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface CloseabilityScore {
  score: number;           // 0-100, higher = more likely to sell
  factors: CloseabilityFactor[];
  recommendation: string;
}

export interface CloseabilityFactor {
  factor: string;
  impact: number;         // Positive = helps, Negative = hurts
  description: string;
}

export interface StockPriorityItem {
  vin: string;
  variantId: string;
  agingScore: number;
  closeabilityScore: number;
  priorityScore: number;
  recommendedAction: string;
  urgency: 'NOW' | 'THIS_WEEK' | 'THIS_MONTH';
}

// Aging thresholds in days
export const AGING_THRESHOLDS = {
  FRESH: 30,        // 0-30 days
  AGING: 60,        // 31-60 days
  STALE: 90,        // 61-90 days
  CRITICAL: 120,    // 90+ days
};

// Configuration for scoring weights
export const SCORING_CONFIG = {
  aging: {
    baseWeight: 40,         // Max points from aging
    daysPerPoint: 0.5,      // Points per day over threshold
    criticalMultiplier: 1.5, // Multiplier for critical stock
  },
  demand: {
    baseWeight: 30,         // Max points from demand signals
    inquiryWeight: 5,       // Points per inquiry
    testDriveWeight: 10,    // Points per test drive
    maxPoints: 30,
  },
  market: {
    baseWeight: 20,         // Max points from market factors
    seasonalBonus: 10,      // Bonus for in-season vehicles
    campaignBonus: 5,       // Bonus if campaign active
  },
  color: {
    baseWeight: 10,         // Max points from color popularity
    popularBonus: 10,       // Bonus for popular colors
    unpopularPenalty: -10,  // Penalty for unpopular colors
  },
};

/**
 * Calculate aging risk score for a vehicle in inventory
 */
export function calculateAgingScore(
  stockDate: Date,
  currentDate: Date = new Date()
): StockAgingScore {
  const daysInStock = Math.floor(
    (currentDate.getTime() - stockDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let score = 0;
  const factors: StockRiskFactor[] = [];

  // Base aging score
  if (daysInStock > AGING_THRESHOLDS.FRESH) {
    const daysOverFresh = daysInStock - AGING_THRESHOLDS.FRESH;
    const agingPoints = Math.min(
      SCORING_CONFIG.aging.baseWeight,
      daysOverFresh * SCORING_CONFIG.aging.daysPerPoint
    );

    if (daysInStock > AGING_THRESHOLDS.CRITICAL) {
      score += agingPoints * SCORING_CONFIG.aging.criticalMultiplier;
      factors.push({
        factor: 'critical_age',
        impact: Math.round(agingPoints * SCORING_CONFIG.aging.criticalMultiplier),
        description: `Vehicle in stock for ${daysInStock} days (critical)`,
      });
    } else if (daysInStock > AGING_THRESHOLDS.STALE) {
      score += agingPoints * 1.2;
      factors.push({
        factor: 'stale_age',
        impact: Math.round(agingPoints * 1.2),
        description: `Vehicle in stock for ${daysInStock} days (stale)`,
      });
    } else {
      score += agingPoints;
      factors.push({
        factor: 'aging',
        impact: Math.round(agingPoints),
        description: `Vehicle in stock for ${daysInStock} days`,
      });
    }
  }

  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (score >= 50 || daysInStock > AGING_THRESHOLDS.CRITICAL) {
    riskLevel = 'CRITICAL';
  } else if (score >= 35 || daysInStock > AGING_THRESHOLDS.STALE) {
    riskLevel = 'HIGH';
  } else if (score >= 20 || daysInStock > AGING_THRESHOLDS.AGING) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  return {
    score: Math.min(100, Math.round(score)),
    riskLevel,
    daysInStock,
    factors,
  };
}

/**
 * Calculate closeability score based on demand and market signals
 */
export function calculateCloseabilityScore(params: {
  daysInStock: number;
  recentInquiries: number;
  recentTestDrives: number;
  colorPopularity: 'HIGH' | 'MEDIUM' | 'LOW';
  hasActiveCampaign: boolean;
  isSeasonalFavorite: boolean;
}): CloseabilityScore {
  let score = 50; // Start at neutral
  const factors: CloseabilityFactor[] = [];

  // Freshness bonus/penalty
  if (params.daysInStock < AGING_THRESHOLDS.FRESH) {
    const freshnessBonus = 10;
    score += freshnessBonus;
    factors.push({
      factor: 'freshness',
      impact: freshnessBonus,
      description: 'Fresh stock (under 30 days)',
    });
  } else if (params.daysInStock > AGING_THRESHOLDS.STALE) {
    const agingPenalty = -15;
    score += agingPenalty;
    factors.push({
      factor: 'aging',
      impact: agingPenalty,
      description: 'Aging stock (over 60 days)',
    });
  }

  // Demand signals
  if (params.recentInquiries > 0) {
    const inquiryBonus = Math.min(15, params.recentInquiries * SCORING_CONFIG.demand.inquiryWeight);
    score += inquiryBonus;
    factors.push({
      factor: 'inquiries',
      impact: inquiryBonus,
      description: `${params.recentInquiries} recent inquiries`,
    });
  }

  if (params.recentTestDrives > 0) {
    const testDriveBonus = Math.min(20, params.recentTestDrives * SCORING_CONFIG.demand.testDriveWeight);
    score += testDriveBonus;
    factors.push({
      factor: 'test_drives',
      impact: testDriveBonus,
      description: `${params.recentTestDrives} recent test drives`,
    });
  }

  // Color popularity
  if (params.colorPopularity === 'HIGH') {
    score += SCORING_CONFIG.color.popularBonus;
    factors.push({
      factor: 'color',
      impact: SCORING_CONFIG.color.popularBonus,
      description: 'Popular color choice',
    });
  } else if (params.colorPopularity === 'LOW') {
    score += SCORING_CONFIG.color.unpopularPenalty;
    factors.push({
      factor: 'color',
      impact: SCORING_CONFIG.color.unpopularPenalty,
      description: 'Less popular color',
    });
  }

  // Campaign bonus
  if (params.hasActiveCampaign) {
    score += SCORING_CONFIG.market.campaignBonus;
    factors.push({
      factor: 'campaign',
      impact: SCORING_CONFIG.market.campaignBonus,
      description: 'Active campaign available',
    });
  }

  // Seasonal bonus
  if (params.isSeasonalFavorite) {
    score += SCORING_CONFIG.market.seasonalBonus;
    factors.push({
      factor: 'seasonal',
      impact: SCORING_CONFIG.market.seasonalBonus,
      description: 'In-season vehicle type',
    });
  }

  // Generate recommendation
  const recommendation = generateCloseabilityRecommendation(score, factors);

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    factors,
    recommendation,
  };
}

function generateCloseabilityRecommendation(score: number, factors: CloseabilityFactor[]): string {
  if (score >= 80) {
    return 'High demand vehicle - prioritize for customers seeking quick delivery';
  }
  if (score >= 60) {
    return 'Good prospects - include in recommendations for matching customer profiles';
  }
  if (score >= 40) {
    const hasAgingFactor = factors.some(f => f.factor === 'aging');
    if (hasAgingFactor) {
      return 'Consider offering additional incentives to move this unit';
    }
    return 'Standard priority - market as part of regular inventory';
  }
  if (score >= 20) {
    return 'Low demand - bundle with campaign offers or accessories';
  }
  return 'At risk - recommend aggressive pricing or dealer transfer';
}

/**
 * Calculate priority score combining aging risk and closeability
 */
export function calculatePriorityScore(
  agingScore: number,
  closeabilityScore: number
): number {
  // Priority = weighted combination
  // Higher aging score = needs attention
  // Lower closeability = harder to sell = needs attention
  const agingWeight = 0.6;
  const closeabilityWeight = 0.4;

  // Invert closeability for priority (low closeability = high priority)
  const invertedCloseability = 100 - closeabilityScore;

  return Math.round(
    agingScore * agingWeight + invertedCloseability * closeabilityWeight
  );
}

/**
 * Get urgency level from priority score
 */
export function getUrgencyLevel(priorityScore: number): 'NOW' | 'THIS_WEEK' | 'THIS_MONTH' {
  if (priorityScore >= 70) return 'NOW';
  if (priorityScore >= 40) return 'THIS_WEEK';
  return 'THIS_MONTH';
}

/**
 * Generate recommended action for stock item
 */
export function getRecommendedAction(
  agingScore: number,
  closeabilityScore: number,
  hasActiveCampaign: boolean
): string {
  if (agingScore >= 60 && closeabilityScore < 40) {
    return 'Immediate: Apply maximum discount or consider dealer swap';
  }
  if (agingScore >= 60) {
    return 'Urgent: Proactively offer to customers with matching preferences';
  }
  if (closeabilityScore >= 70) {
    return 'Highlight: Feature in showroom and marketing materials';
  }
  if (closeabilityScore < 30 && !hasActiveCampaign) {
    return 'Action: Create campaign bundle or accessory package';
  }
  if (agingScore >= 40) {
    return 'Monitor: Include in weekly follow-up list';
  }
  return 'Standard: Maintain regular inventory visibility';
}

/**
 * Calculate stock health metrics
 */
export interface StockHealthMetrics {
  healthScore: number;        // 0-100
  freshPercentage: number;    // % under 30 days
  agingPercentage: number;    // % over 60 days
  criticalPercentage: number; // % over 90 days
  avgDaysInStock: number;
  turnoverRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export function calculateStockHealth(
  inventoryItems: Array<{ stockDate: Date }>
): StockHealthMetrics {
  if (inventoryItems.length === 0) {
    return {
      healthScore: 100,
      freshPercentage: 100,
      agingPercentage: 0,
      criticalPercentage: 0,
      avgDaysInStock: 0,
      turnoverRisk: 'LOW',
    };
  }

  const now = new Date();
  let totalDays = 0;
  let freshCount = 0;
  let agingCount = 0;
  let criticalCount = 0;

  inventoryItems.forEach(item => {
    const days = Math.floor(
      (now.getTime() - item.stockDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    totalDays += days;

    if (days <= AGING_THRESHOLDS.FRESH) {
      freshCount++;
    } else if (days > AGING_THRESHOLDS.STALE) {
      agingCount++;
      if (days > AGING_THRESHOLDS.CRITICAL) {
        criticalCount++;
      }
    }
  });

  const total = inventoryItems.length;
  const freshPercentage = Math.round((freshCount / total) * 100);
  const agingPercentage = Math.round((agingCount / total) * 100);
  const criticalPercentage = Math.round((criticalCount / total) * 100);
  const avgDaysInStock = Math.round(totalDays / total);

  // Health score calculation
  const healthScore = Math.max(0, Math.round(
    freshPercentage - (agingPercentage * 0.5) - (criticalPercentage * 1.5)
  ));

  // Turnover risk
  let turnoverRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  if (criticalPercentage > 20 || avgDaysInStock > 60) {
    turnoverRisk = 'HIGH';
  } else if (agingPercentage > 30 || avgDaysInStock > 45) {
    turnoverRisk = 'MEDIUM';
  } else {
    turnoverRisk = 'LOW';
  }

  return {
    healthScore,
    freshPercentage,
    agingPercentage,
    criticalPercentage,
    avgDaysInStock,
    turnoverRisk,
  };
}
