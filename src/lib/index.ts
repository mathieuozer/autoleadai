// Mock Data
export {
  mockOrders,
  mockCustomers,
  mockVehicles,
  mockActivities,
  mockUsers,
  getOrderById,
  getOrdersBySalesperson,
  getActivitiesForOrder,
} from './mock-data';

// Risk Scoring
export {
  calculateRiskScore,
  calculateSilenceScore,
  calculateFinancingScore,
  calculateDeliveryDelayScore,
  calculateSentimentScore,
  calculateStagnationScore,
  getRiskLevel,
  calculateFulfillmentProbability,
  DEFAULT_CONFIG,
} from './risk-scoring';
export type { RiskScore, RiskScoringConfig } from './risk-scoring';

// Next Best Action
export {
  determineNextBestAction,
  getAllApplicableActions,
  getUrgencyPriority,
  NBA_RULES,
} from './next-best-action';
export type { NBARule } from './next-best-action';

// Priority List
export {
  generatePriorityItem,
  generatePriorityItems,
  generatePriorityList,
  generateSummary,
  filterByRiskLevel,
  getTopPriorityItems,
  getImmediateActions,
  getTodayActions,
  calculateAggregateStats,
} from './priority-list';

// Discount Rules
export {
  getRequiredApprovalLevel,
  parseDiscountRules,
  calculateDiscountPercentage,
  validateDiscountRequest,
  getApprovalLevelName,
  getNextApproverRole,
  DEFAULT_DISCOUNT_RULES,
  BRAND_DISCOUNT_RULES,
} from './discount-rules';
export type { DiscountRule, DiscountRulesConfig, DiscountValidationResult } from './discount-rules';

// Stock Scoring
export {
  calculateAgingScore,
  calculateCloseabilityScore,
  calculatePriorityScore,
  getUrgencyLevel,
  getRecommendedAction,
  calculateStockHealth,
  AGING_THRESHOLDS,
  SCORING_CONFIG,
} from './stock-scoring';
export type {
  StockAgingScore,
  StockRiskFactor,
  CloseabilityScore,
  CloseabilityFactor,
  StockPriorityItem,
  StockHealthMetrics,
} from './stock-scoring';

// Color Recommendation
export {
  generateColorRecommendations,
  getBestColorToClose,
  generateRecommendationReason,
  calculateDemandSupplyMismatch,
  getColorPopularityRanking,
} from './color-recommendation';
export type {
  ColorRecommendation,
  ColorBadge,
  ColorMetrics,
  ColorDemandData,
  ColorStockData,
} from './color-recommendation';

// Quotation PDF
export {
  generateQuotationNumber,
  calculateQuotationTotals,
  formatCurrency,
  getDefaultTerms,
  generatePdfTemplateData,
  validateQuotationData,
  getQuotationStatusInfo,
} from './quotation-pdf';
export type {
  QuotationData,
  VehicleSpec,
  AccessoryItem,
  FeeItem,
  QuotationPdfOptions,
} from './quotation-pdf';
