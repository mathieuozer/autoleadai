import {
  calculateRiskScore,
  calculateSilenceScore,
  calculateFinancingScore,
  calculateDeliveryDelayScore,
  calculateSentimentScore,
  calculateStagnationScore,
  getRiskLevel,
  calculateFulfillmentProbability,
  DEFAULT_CONFIG,
} from '../risk-scoring';
import { Order } from '@/types';

// Helper to create a base order for testing
const createBaseOrder = (overrides: Partial<Order> = {}): Order => {
  const now = new Date();
  return {
    id: 'test-order',
    customerId: 'cust-1',
    vehicleId: 'veh-1',
    status: 'BOOKING_DONE',
    source: 'WALK_IN',
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    totalAmount: 100000,
    financingStatus: 'APPROVED',
    riskScore: 0,
    fulfillmentProbability: 0,
    lastContactDaysAgo: 1,
    customer: { id: 'cust-1', name: 'Test Customer', phone: '+1234567890' },
    vehicle: { id: 'veh-1', make: 'Toyota', model: 'Camry', year: 2024 },
    ...overrides,
  };
};

describe('Risk Scoring', () => {
  describe('getRiskLevel', () => {
    it('returns HIGH for scores >= 60', () => {
      expect(getRiskLevel(60)).toBe('HIGH');
      expect(getRiskLevel(75)).toBe('HIGH');
      expect(getRiskLevel(100)).toBe('HIGH');
    });

    it('returns MEDIUM for scores >= 30 and < 60', () => {
      expect(getRiskLevel(30)).toBe('MEDIUM');
      expect(getRiskLevel(45)).toBe('MEDIUM');
      expect(getRiskLevel(59)).toBe('MEDIUM');
    });

    it('returns LOW for scores < 30', () => {
      expect(getRiskLevel(0)).toBe('LOW');
      expect(getRiskLevel(15)).toBe('LOW');
      expect(getRiskLevel(29)).toBe('LOW');
    });
  });

  describe('calculateSilenceScore', () => {
    it('returns 0 impact when contact is within threshold', () => {
      const result = calculateSilenceScore(5, 7);
      expect(result.impact).toBe(0);
    });

    it('returns 0 impact when contact is at threshold', () => {
      const result = calculateSilenceScore(7, 7);
      expect(result.impact).toBe(0);
    });

    it('calculates impact for days over threshold', () => {
      const result = calculateSilenceScore(10, 7); // 3 days over
      expect(result.impact).toBe(9); // 3 * 3 = 9
      expect(result.description).toBe('No contact for 10 days');
    });

    it('caps impact at 25', () => {
      const result = calculateSilenceScore(20, 7); // 13 days over, would be 39
      expect(result.impact).toBe(25);
    });
  });

  describe('calculateFinancingScore', () => {
    it('returns 0 impact when financing is not pending', () => {
      const order = createBaseOrder({ financingStatus: 'APPROVED' });
      const result = calculateFinancingScore(order, 2);
      expect(result.impact).toBe(0);
    });

    it('returns 0 impact when financing is CASH', () => {
      const order = createBaseOrder({ financingStatus: 'CASH' });
      const result = calculateFinancingScore(order, 2);
      expect(result.impact).toBe(0);
    });

    it('returns 0 impact when pending within threshold', () => {
      const now = new Date();
      const order = createBaseOrder({
        financingStatus: 'PENDING',
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      });
      const result = calculateFinancingScore(order, 2);
      expect(result.impact).toBe(0);
    });

    it('calculates impact for pending over threshold', () => {
      const now = new Date();
      const order = createBaseOrder({
        financingStatus: 'PENDING',
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      });
      const result = calculateFinancingScore(order, 2);
      expect(result.impact).toBe(18); // (5-2) * 6 = 18
      expect(result.description).toContain('Financing pending');
    });

    it('caps impact at 30', () => {
      const now = new Date();
      const order = createBaseOrder({
        financingStatus: 'PENDING',
        updatedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      });
      const result = calculateFinancingScore(order, 2);
      expect(result.impact).toBe(30); // (10-2) * 6 = 48, capped at 30
    });
  });

  describe('calculateDeliveryDelayScore', () => {
    it('returns 0 impact when no expected delivery date', () => {
      const order = createBaseOrder({ expectedDeliveryDate: undefined });
      const result = calculateDeliveryDelayScore(order);
      expect(result.impact).toBe(0);
    });

    it('returns 0 impact when delivery date is in future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const order = createBaseOrder({ expectedDeliveryDate: futureDate.toISOString() });
      const result = calculateDeliveryDelayScore(order);
      expect(result.impact).toBe(0);
    });

    it('calculates impact for delayed delivery', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      const order = createBaseOrder({ expectedDeliveryDate: pastDate.toISOString() });
      const result = calculateDeliveryDelayScore(order);
      expect(result.impact).toBe(12); // 3 * 4 = 12
      expect(result.description).toContain('delayed');
    });

    it('caps impact at 20', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const order = createBaseOrder({ expectedDeliveryDate: pastDate.toISOString() });
      const result = calculateDeliveryDelayScore(order);
      expect(result.impact).toBe(20); // 10 * 4 = 40, capped at 20
    });
  });

  describe('calculateSentimentScore', () => {
    it('returns 0 impact when no activities', () => {
      const order = createBaseOrder({ activities: [] });
      const result = calculateSentimentScore(order);
      expect(result.impact).toBe(0);
    });

    it('returns 0 impact when no sentiment in activities', () => {
      const order = createBaseOrder({
        activities: [
          {
            id: 'act-1',
            orderId: 'test-order',
            type: 'CALL_OUTBOUND',
            channel: 'CALL',
            summary: 'Test call',
            performedBy: 'user-1',
            performedAt: new Date().toISOString(),
          },
        ],
      });
      const result = calculateSentimentScore(order);
      expect(result.impact).toBe(0);
    });

    it('returns 0 impact for positive sentiment', () => {
      const order = createBaseOrder({
        activities: [
          {
            id: 'act-1',
            orderId: 'test-order',
            type: 'CALL_OUTBOUND',
            channel: 'CALL',
            summary: 'Great call',
            sentiment: 'POSITIVE',
            performedBy: 'user-1',
            performedAt: new Date().toISOString(),
          },
        ],
      });
      const result = calculateSentimentScore(order);
      expect(result.impact).toBe(0);
    });

    it('returns 15 impact for negative sentiment', () => {
      const order = createBaseOrder({
        activities: [
          {
            id: 'act-1',
            orderId: 'test-order',
            type: 'WHATSAPP_RECEIVED',
            channel: 'WHATSAPP',
            summary: 'Customer complaint',
            sentiment: 'NEGATIVE',
            performedBy: 'cust-1',
            performedAt: new Date().toISOString(),
          },
        ],
      });
      const result = calculateSentimentScore(order);
      expect(result.impact).toBe(15);
      expect(result.description).toContain('Negative');
    });

    it('uses latest sentiment when multiple activities exist', () => {
      const now = new Date();
      const order = createBaseOrder({
        activities: [
          {
            id: 'act-1',
            orderId: 'test-order',
            type: 'CALL_OUTBOUND',
            channel: 'CALL',
            summary: 'Good call',
            sentiment: 'POSITIVE',
            performedBy: 'user-1',
            performedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          },
          {
            id: 'act-2',
            orderId: 'test-order',
            type: 'WHATSAPP_RECEIVED',
            channel: 'WHATSAPP',
            summary: 'Complaint',
            sentiment: 'NEGATIVE',
            performedBy: 'cust-1',
            performedAt: now.toISOString(), // Now (most recent)
          },
        ],
      });
      const result = calculateSentimentScore(order);
      expect(result.impact).toBe(15); // Latest is negative
    });
  });

  describe('calculateStagnationScore', () => {
    it('returns 0 for recent orders', () => {
      const now = new Date();
      const order = createBaseOrder({
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      });
      const result = calculateStagnationScore(order);
      expect(result.impact).toBe(0);
    });

    it('returns 0 when recently updated', () => {
      const now = new Date();
      const order = createBaseOrder({
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      });
      const result = calculateStagnationScore(order);
      expect(result.impact).toBe(0);
    });

    it('calculates impact for stagnant orders', () => {
      const now = new Date();
      const order = createBaseOrder({
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
        updatedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      });
      const result = calculateStagnationScore(order);
      expect(result.impact).toBe(5); // 10 / 2 = 5
      expect(result.description).toContain('stagnant');
    });

    it('caps impact at 10', () => {
      const now = new Date();
      const order = createBaseOrder({
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        updatedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
      });
      const result = calculateStagnationScore(order);
      expect(result.impact).toBe(10); // 25 / 2 = 12.5, capped at 10
    });
  });

  describe('calculateRiskScore', () => {
    it('returns LOW risk for healthy order', () => {
      const order = createBaseOrder({
        lastContactDaysAgo: 2,
        financingStatus: 'APPROVED',
        activities: [],
      });
      const result = calculateRiskScore(order);
      expect(result.level).toBe('LOW');
      expect(result.value).toBeLessThan(30);
    });

    it('returns HIGH risk for problematic order', () => {
      const now = new Date();
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const order = createBaseOrder({
        lastContactDaysAgo: 12, // Long silence
        financingStatus: 'PENDING',
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days pending
        expectedDeliveryDate: pastDate.toISOString(), // 5 days delayed
        activities: [
          {
            id: 'act-1',
            orderId: 'test-order',
            type: 'WHATSAPP_RECEIVED',
            channel: 'WHATSAPP',
            summary: 'Angry customer',
            sentiment: 'NEGATIVE',
            performedBy: 'cust-1',
            performedAt: now.toISOString(),
          },
        ],
      });
      const result = calculateRiskScore(order);
      expect(result.level).toBe('HIGH');
      expect(result.value).toBeGreaterThanOrEqual(60);
      expect(result.factors.length).toBeGreaterThan(0);
    });

    it('sorts factors by impact descending', () => {
      const now = new Date();
      const order = createBaseOrder({
        lastContactDaysAgo: 10,
        financingStatus: 'PENDING',
        updatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      });
      const result = calculateRiskScore(order);

      for (let i = 0; i < result.factors.length - 1; i++) {
        expect(result.factors[i].impact).toBeGreaterThanOrEqual(result.factors[i + 1].impact);
      }
    });

    it('caps total score at 100', () => {
      const now = new Date();
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const order = createBaseOrder({
        lastContactDaysAgo: 20, // Max 25
        financingStatus: 'PENDING',
        updatedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // Max 30
        expectedDeliveryDate: pastDate.toISOString(), // Max 20
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Stagnant
        activities: [
          {
            id: 'act-1',
            orderId: 'test-order',
            type: 'WHATSAPP_RECEIVED',
            channel: 'WHATSAPP',
            summary: 'Very angry',
            sentiment: 'NEGATIVE',
            performedBy: 'cust-1',
            performedAt: now.toISOString(),
          },
        ],
      });
      const result = calculateRiskScore(order);
      expect(result.value).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateFulfillmentProbability', () => {
    it('returns inverse of risk score', () => {
      expect(calculateFulfillmentProbability(0)).toBe(100);
      expect(calculateFulfillmentProbability(50)).toBe(50);
      expect(calculateFulfillmentProbability(75)).toBe(25);
    });

    it('has a minimum floor of 20%', () => {
      expect(calculateFulfillmentProbability(100)).toBe(20);
      expect(calculateFulfillmentProbability(90)).toBe(20);
    });
  });
});
