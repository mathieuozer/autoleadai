/**
 * AI Color Recommendation Engine
 *
 * Analyzes demand patterns, stock levels, and market trends
 * to recommend the "Best Color to Close" for each variant.
 */

export interface ColorRecommendation {
  exteriorColorId: string;
  interiorColorId: string;
  score: number;           // 0-100, higher = better to push
  reason: string;
  badges: ColorBadge[];
  metrics: ColorMetrics;
}

export interface ColorBadge {
  type: 'BEST_SELLER' | 'HIGH_DEMAND' | 'LOW_STOCK' | 'FAST_MOVER' | 'CAMPAIGN' | 'TRENDING';
  label: string;
}

export interface ColorMetrics {
  stockCount: number;
  demandScore: number;
  supplyScore: number;
  salesVelocity: number;   // Units sold per month
  daysToSell: number;      // Avg days to sell this color
}

export interface ColorDemandData {
  exteriorColorId: string;
  inquiryCount: number;
  testDriveCount: number;
  orderCount: number;
  deliveryCount: number;
  avgStockLevel: number;
  stockouts: number;
}

export interface ColorStockData {
  exteriorColorId: string;
  interiorColorId: string;
  count: number;
  avgDaysInStock: number;
  hasActiveCampaign: boolean;
}

/**
 * Generate color recommendations for a variant
 */
export function generateColorRecommendations(
  variantId: string,
  stockData: ColorStockData[],
  demandData: ColorDemandData[]
): ColorRecommendation[] {
  const recommendations: ColorRecommendation[] = [];

  // Group stock by exterior color
  const stockByColor = new Map<string, ColorStockData[]>();
  stockData.forEach(stock => {
    const existing = stockByColor.get(stock.exteriorColorId) || [];
    existing.push(stock);
    stockByColor.set(stock.exteriorColorId, existing);
  });

  // Create demand lookup
  const demandByColor = new Map<string, ColorDemandData>();
  demandData.forEach(d => demandByColor.set(d.exteriorColorId, d));

  // Calculate recommendations for each color
  stockByColor.forEach((stocks, exteriorColorId) => {
    const demand = demandByColor.get(exteriorColorId);

    stocks.forEach(stock => {
      const recommendation = calculateColorScore(stock, demand);
      recommendations.push({
        exteriorColorId,
        interiorColorId: stock.interiorColorId,
        ...recommendation,
      });
    });
  });

  // Sort by score descending
  recommendations.sort((a, b) => b.score - a.score);

  return recommendations;
}

function calculateColorScore(
  stock: ColorStockData,
  demand?: ColorDemandData
): Omit<ColorRecommendation, 'exteriorColorId' | 'interiorColorId'> {
  let score = 50; // Start neutral
  const badges: ColorBadge[] = [];
  const reasons: string[] = [];

  // Stock availability factor
  if (stock.count > 0) {
    // Available stock is good
    if (stock.count === 1) {
      score += 15;
      badges.push({ type: 'LOW_STOCK', label: 'Last One' });
      reasons.push('Last unit available');
    } else if (stock.count <= 3) {
      score += 10;
      badges.push({ type: 'LOW_STOCK', label: 'Limited' });
      reasons.push('Limited availability');
    }
  } else {
    // No stock - can't recommend
    score = 0;
  }

  // Demand signals
  if (demand) {
    const demandScore = calculateDemandScore(demand);
    score += demandScore;

    if (demand.orderCount > demand.deliveryCount * 0.8) {
      badges.push({ type: 'BEST_SELLER', label: 'Best Seller' });
      reasons.push('Top performing color');
    }

    if (demand.inquiryCount > 10) {
      badges.push({ type: 'HIGH_DEMAND', label: 'High Interest' });
      reasons.push('Many customer inquiries');
    }

    if (demand.stockouts > 0) {
      badges.push({ type: 'TRENDING', label: 'Trending' });
      reasons.push('Recently out of stock');
    }
  }

  // Campaign bonus
  if (stock.hasActiveCampaign) {
    score += 10;
    badges.push({ type: 'CAMPAIGN', label: 'Offer' });
    reasons.push('Active campaign discount');
  }

  // Aging factor (faster to sell = better)
  if (stock.avgDaysInStock < 30) {
    score += 10;
    badges.push({ type: 'FAST_MOVER', label: 'Fast Mover' });
    reasons.push('Sells quickly');
  } else if (stock.avgDaysInStock > 60) {
    score -= 10;
    reasons.push('Slower moving color');
  }

  // Calculate metrics
  const metrics: ColorMetrics = {
    stockCount: stock.count,
    demandScore: demand ? calculateDemandScore(demand) : 0,
    supplyScore: calculateSupplyScore(stock.count),
    salesVelocity: demand ? calculateSalesVelocity(demand) : 0,
    daysToSell: stock.avgDaysInStock,
  };

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reason: reasons.length > 0 ? reasons[0] : 'Available in stock',
    badges,
    metrics,
  };
}

function calculateDemandScore(demand: ColorDemandData): number {
  // Weighted demand calculation
  const inquiryWeight = 1;
  const testDriveWeight = 3;
  const orderWeight = 5;
  const deliveryWeight = 2;

  const rawScore =
    demand.inquiryCount * inquiryWeight +
    demand.testDriveCount * testDriveWeight +
    demand.orderCount * orderWeight +
    demand.deliveryCount * deliveryWeight;

  // Normalize to 0-30 range
  return Math.min(30, Math.round(rawScore / 5));
}

function calculateSupplyScore(stockCount: number): number {
  // Score based on healthy inventory level (5-10 units ideal)
  if (stockCount >= 5 && stockCount <= 10) return 100;
  if (stockCount >= 3 && stockCount <= 15) return 75;
  if (stockCount >= 1 && stockCount <= 20) return 50;
  if (stockCount === 0) return 0;
  return 25; // Over-stocked
}

function calculateSalesVelocity(demand: ColorDemandData): number {
  // Simple velocity calculation (deliveries per 30-day period)
  return Math.round(demand.deliveryCount / 1); // Assuming data is monthly
}

/**
 * Get the "Best Color to Close" for a variant
 */
export function getBestColorToClose(
  recommendations: ColorRecommendation[]
): ColorRecommendation | null {
  if (recommendations.length === 0) return null;
  return recommendations[0]; // Already sorted by score
}

/**
 * Generate reason text for color recommendation
 */
export function generateRecommendationReason(
  recommendation: ColorRecommendation
): string {
  const { badges, metrics } = recommendation;

  if (badges.some(b => b.type === 'BEST_SELLER')) {
    return `Best selling color with ${metrics.salesVelocity} units/month velocity`;
  }

  if (badges.some(b => b.type === 'LOW_STOCK')) {
    return `Only ${metrics.stockCount} unit${metrics.stockCount > 1 ? 's' : ''} available`;
  }

  if (badges.some(b => b.type === 'HIGH_DEMAND')) {
    return `High customer interest with demand score of ${metrics.demandScore}`;
  }

  if (badges.some(b => b.type === 'CAMPAIGN')) {
    return 'Active campaign makes this a great value proposition';
  }

  if (badges.some(b => b.type === 'FAST_MOVER')) {
    return `Fast moving color, average ${metrics.daysToSell} days to sell`;
  }

  return 'Available and ready for immediate delivery';
}

/**
 * Calculate demand-supply mismatch score
 */
export function calculateDemandSupplyMismatch(
  demandScore: number,
  supplyScore: number
): {
  mismatchScore: number;
  status: 'BALANCED' | 'UNDERSUPPLIED' | 'OVERSUPPLIED';
  recommendation: string;
} {
  const mismatchScore = Math.abs(demandScore - supplyScore);

  if (mismatchScore < 20) {
    return {
      mismatchScore,
      status: 'BALANCED',
      recommendation: 'Supply matches demand - maintain current levels',
    };
  }

  if (demandScore > supplyScore) {
    return {
      mismatchScore,
      status: 'UNDERSUPPLIED',
      recommendation: 'Consider ordering more units in this color',
    };
  }

  return {
    mismatchScore,
    status: 'OVERSUPPLIED',
    recommendation: 'Consider promotional offers or reallocating stock',
  };
}

/**
 * Get color popularity ranking
 */
export function getColorPopularityRanking(
  demandData: ColorDemandData[]
): Array<{ colorId: string; rank: number; score: number }> {
  const scored = demandData.map(d => ({
    colorId: d.exteriorColorId,
    score: calculateDemandScore(d),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}
