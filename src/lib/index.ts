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
