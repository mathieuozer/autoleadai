import {
  generatePriorityItem,
  generatePriorityItems,
  generatePriorityList,
  generateSummary,
  filterByRiskLevel,
  getTopPriorityItems,
  getImmediateActions,
  getTodayActions,
  calculateAggregateStats,
} from '../priority-list';
import { Order, PriorityItem } from '@/types';

// Helper to create a base order for testing
const createBaseOrder = (id: string, overrides: Partial<Order> = {}): Order => {
  const now = new Date();
  return {
    id,
    customerId: 'cust-1',
    vehicleId: 'veh-1',
    status: 'BOOKING_DONE',
    source: 'WALK_IN',
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    totalAmount: 100000,
    financingStatus: 'APPROVED',
    riskScore: 0,
    fulfillmentProbability: 0,
    lastContactDaysAgo: 1,
    customer: { id: 'cust-1', name: 'Test Customer', phone: '+1234567890' },
    vehicle: { id: 'veh-1', make: 'Toyota', model: 'Camry', year: 2024 },
    activities: [],
    ...overrides,
  };
};

describe('Priority List', () => {
  describe('generatePriorityItem', () => {
    it('generates a priority item with correct structure', () => {
      const order = createBaseOrder('order-1');
      const item = generatePriorityItem(order, 1);

      expect(item.id).toContain('priority-order-1');
      expect(item.orderId).toBe('order-1');
      expect(item.rank).toBe(1);
      expect(item.riskScore).toBeGreaterThanOrEqual(0);
      expect(item.riskScore).toBeLessThanOrEqual(100);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(item.riskLevel);
      expect(item.riskFactors).toBeDefined();
      expect(item.nextBestAction).toBeDefined();
      expect(item.generatedAt).toBeDefined();
      expect(item.expiresAt).toBeDefined();
    });

    it('calculates risk score for the order', () => {
      const now = new Date();
      const order = createBaseOrder('order-1', {
        lastContactDaysAgo: 12,
        financingStatus: 'PENDING',
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const item = generatePriorityItem(order, 1);

      expect(item.riskScore).toBeGreaterThan(30); // Should be medium or high
      expect(item.riskFactors.length).toBeGreaterThan(0);
    });

    it('determines next best action', () => {
      const order = createBaseOrder('order-1', {
        lastContactDaysAgo: 10,
      });

      const item = generatePriorityItem(order, 1);

      expect(item.nextBestAction.action).toBeDefined();
      expect(item.nextBestAction.channel).toBeDefined();
      expect(item.nextBestAction.urgency).toBeDefined();
    });

    it('enriches order with calculated values', () => {
      const order = createBaseOrder('order-1');
      const item = generatePriorityItem(order, 1);

      expect(item.order.riskScore).toBe(item.riskScore);
      expect(item.order.fulfillmentProbability).toBeGreaterThan(0);
    });
  });

  describe('generatePriorityItems', () => {
    it('filters out delivered orders', () => {
      const orders = [
        createBaseOrder('order-1', { status: 'DELIVERED' }),
        createBaseOrder('order-2', { status: 'BOOKING_DONE' }),
      ];

      const items = generatePriorityItems(orders);

      expect(items.length).toBe(1);
      expect(items[0].orderId).toBe('order-2');
    });

    it('filters out cancelled orders', () => {
      const orders = [
        createBaseOrder('order-1', { status: 'CANCELLED' }),
        createBaseOrder('order-2', { status: 'BOOKING_DONE' }),
      ];

      const items = generatePriorityItems(orders);

      expect(items.length).toBe(1);
      expect(items[0].orderId).toBe('order-2');
    });

    it('sorts by risk score descending', () => {
      const now = new Date();
      const orders = [
        createBaseOrder('low-risk', { lastContactDaysAgo: 1 }),
        createBaseOrder('high-risk', {
          lastContactDaysAgo: 15,
          financingStatus: 'PENDING',
          updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        createBaseOrder('medium-risk', { lastContactDaysAgo: 10 }),
      ];

      const items = generatePriorityItems(orders);

      expect(items[0].orderId).toBe('high-risk');
      expect(items[0].rank).toBe(1);
      for (let i = 0; i < items.length - 1; i++) {
        expect(items[i].riskScore).toBeGreaterThanOrEqual(items[i + 1].riskScore);
      }
    });

    it('assigns sequential ranks', () => {
      const orders = [
        createBaseOrder('order-1'),
        createBaseOrder('order-2'),
        createBaseOrder('order-3'),
      ];

      const items = generatePriorityItems(orders);

      expect(items[0].rank).toBe(1);
      expect(items[1].rank).toBe(2);
      expect(items[2].rank).toBe(3);
    });
  });

  describe('generateSummary', () => {
    it('counts risk levels correctly', () => {
      const items: PriorityItem[] = [
        { riskLevel: 'HIGH', nextBestAction: { action: 'Test' } } as PriorityItem,
        { riskLevel: 'HIGH', nextBestAction: { action: 'Test' } } as PriorityItem,
        { riskLevel: 'MEDIUM', nextBestAction: { action: 'Test' } } as PriorityItem,
        { riskLevel: 'LOW', nextBestAction: { action: 'No action required' } } as PriorityItem,
      ];

      const summary = generateSummary(items);

      expect(summary.highRisk).toBe(2);
      expect(summary.mediumRisk).toBe(1);
      expect(summary.lowRisk).toBe(1);
    });

    it('counts actions correctly', () => {
      const items: PriorityItem[] = [
        { riskLevel: 'HIGH', nextBestAction: { action: 'Call customer' } } as PriorityItem,
        { riskLevel: 'MEDIUM', nextBestAction: { action: 'Send message' } } as PriorityItem,
        { riskLevel: 'LOW', nextBestAction: { action: 'No action required' } } as PriorityItem,
      ];

      const summary = generateSummary(items);

      expect(summary.totalActions).toBe(2);
    });

    it('handles empty array', () => {
      const summary = generateSummary([]);

      expect(summary.highRisk).toBe(0);
      expect(summary.mediumRisk).toBe(0);
      expect(summary.lowRisk).toBe(0);
      expect(summary.totalActions).toBe(0);
    });
  });

  describe('generatePriorityList', () => {
    it('generates complete priority list structure', () => {
      const orders = [
        createBaseOrder('order-1'),
        createBaseOrder('order-2'),
      ];

      const list = generatePriorityList(orders);

      expect(list.date).toBeDefined();
      expect(list.generatedAt).toBeDefined();
      expect(list.summary).toBeDefined();
      expect(list.items).toBeDefined();
      expect(list.items.length).toBe(2);
    });

    it('sets date to today', () => {
      const orders = [createBaseOrder('order-1')];
      const list = generatePriorityList(orders);
      const today = new Date().toISOString().split('T')[0];

      expect(list.date).toBe(today);
    });
  });

  describe('filterByRiskLevel', () => {
    it('filters by HIGH risk', () => {
      const items: PriorityItem[] = [
        { riskLevel: 'HIGH' } as PriorityItem,
        { riskLevel: 'MEDIUM' } as PriorityItem,
        { riskLevel: 'LOW' } as PriorityItem,
      ];

      const filtered = filterByRiskLevel(items, 'HIGH');

      expect(filtered.length).toBe(1);
      expect(filtered[0].riskLevel).toBe('HIGH');
    });

    it('returns empty array when no matches', () => {
      const items: PriorityItem[] = [
        { riskLevel: 'LOW' } as PriorityItem,
      ];

      const filtered = filterByRiskLevel(items, 'HIGH');

      expect(filtered.length).toBe(0);
    });
  });

  describe('getTopPriorityItems', () => {
    it('returns top N items', () => {
      const items: PriorityItem[] = [
        { rank: 1 } as PriorityItem,
        { rank: 2 } as PriorityItem,
        { rank: 3 } as PriorityItem,
        { rank: 4 } as PriorityItem,
      ];

      const top = getTopPriorityItems(items, 2);

      expect(top.length).toBe(2);
      expect(top[0].rank).toBe(1);
      expect(top[1].rank).toBe(2);
    });

    it('returns all items if N > length', () => {
      const items: PriorityItem[] = [
        { rank: 1 } as PriorityItem,
      ];

      const top = getTopPriorityItems(items, 5);

      expect(top.length).toBe(1);
    });
  });

  describe('getImmediateActions', () => {
    it('returns only NOW urgency items', () => {
      const items: PriorityItem[] = [
        { nextBestAction: { urgency: 'NOW' } } as PriorityItem,
        { nextBestAction: { urgency: 'TODAY' } } as PriorityItem,
        { nextBestAction: { urgency: 'THIS_WEEK' } } as PriorityItem,
      ];

      const immediate = getImmediateActions(items);

      expect(immediate.length).toBe(1);
      expect(immediate[0].nextBestAction.urgency).toBe('NOW');
    });
  });

  describe('getTodayActions', () => {
    it('returns NOW and TODAY urgency items', () => {
      const items: PriorityItem[] = [
        { nextBestAction: { urgency: 'NOW' } } as PriorityItem,
        { nextBestAction: { urgency: 'TODAY' } } as PriorityItem,
        { nextBestAction: { urgency: 'THIS_WEEK' } } as PriorityItem,
      ];

      const today = getTodayActions(items);

      expect(today.length).toBe(2);
    });
  });

  describe('calculateAggregateStats', () => {
    it('calculates correct averages', () => {
      const items: PriorityItem[] = [
        {
          riskScore: 60,
          riskLevel: 'HIGH',
          order: { totalAmount: 100000, fulfillmentProbability: 40 },
        } as PriorityItem,
        {
          riskScore: 40,
          riskLevel: 'MEDIUM',
          order: { totalAmount: 200000, fulfillmentProbability: 60 },
        } as PriorityItem,
      ];

      const stats = calculateAggregateStats(items);

      expect(stats.averageRiskScore).toBe(50);
      expect(stats.averageFulfillmentProbability).toBe(50);
      expect(stats.totalOrderValue).toBe(300000);
      expect(stats.atRiskOrderValue).toBe(300000); // Both are at risk
    });

    it('handles empty array', () => {
      const stats = calculateAggregateStats([]);

      expect(stats.averageRiskScore).toBe(0);
      expect(stats.averageFulfillmentProbability).toBe(100);
      expect(stats.totalOrderValue).toBe(0);
      expect(stats.atRiskOrderValue).toBe(0);
    });

    it('only includes HIGH and MEDIUM in at-risk value', () => {
      const items: PriorityItem[] = [
        {
          riskScore: 70,
          riskLevel: 'HIGH',
          order: { totalAmount: 100000, fulfillmentProbability: 30 },
        } as PriorityItem,
        {
          riskScore: 20,
          riskLevel: 'LOW',
          order: { totalAmount: 200000, fulfillmentProbability: 80 },
        } as PriorityItem,
      ];

      const stats = calculateAggregateStats(items);

      expect(stats.totalOrderValue).toBe(300000);
      expect(stats.atRiskOrderValue).toBe(100000); // Only HIGH risk order
    });
  });
});
