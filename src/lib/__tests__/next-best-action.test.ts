import {
  determineNextBestAction,
  getAllApplicableActions,
  getUrgencyPriority,
  NBA_RULES,
} from '../next-best-action';
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
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    totalAmount: 100000,
    financingStatus: 'APPROVED',
    riskScore: 0,
    fulfillmentProbability: 0,
    lastContactDaysAgo: 1,
    customer: { id: 'cust-1', name: 'Test Customer', phone: '+1234567890', preferredChannel: 'WHATSAPP' },
    vehicle: { id: 'veh-1', make: 'Toyota', model: 'Camry', year: 2024 },
    activities: [],
    ...overrides,
  };
};

describe('Next Best Action', () => {
  describe('getUrgencyPriority', () => {
    it('returns correct priority for NOW', () => {
      expect(getUrgencyPriority('NOW')).toBe(1);
    });

    it('returns correct priority for TODAY', () => {
      expect(getUrgencyPriority('TODAY')).toBe(2);
    });

    it('returns correct priority for THIS_WEEK', () => {
      expect(getUrgencyPriority('THIS_WEEK')).toBe(3);
    });
  });

  describe('determineNextBestAction', () => {
    it('returns financing follow-up for pending financing > 2 days', () => {
      const now = new Date();
      const order = createBaseOrder({
        financingStatus: 'PENDING',
        updatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      });

      const action = determineNextBestAction(order);

      expect(action).not.toBeNull();
      expect(action!.channel).toBe('CALL');
      expect(action!.action).toContain('financing');
    });

    it('returns delivery delay notification for delayed delivery', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);

      const order = createBaseOrder({
        expectedDeliveryDate: pastDate.toISOString(),
        status: 'READY_FOR_DELIVERY',
        activities: [], // No negative sentiment
      });

      const action = determineNextBestAction(order);

      expect(action).not.toBeNull();
      expect(action!.channel).toBe('WHATSAPP');
      expect(action!.urgency).toBe('NOW');
    });

    it('returns escalation call for delayed delivery with negative sentiment', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);

      const order = createBaseOrder({
        expectedDeliveryDate: pastDate.toISOString(),
        status: 'READY_FOR_DELIVERY',
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

      const action = determineNextBestAction(order);

      expect(action).not.toBeNull();
      expect(action!.channel).toBe('CALL');
      expect(action!.urgency).toBe('NOW');
      expect(action!.action).toContain('concerns');
    });

    it('returns schedule delivery for arrived vehicle', () => {
      const order = createBaseOrder({
        status: 'FINANCING_APPROVED',
        lastContactDaysAgo: 1,
      });

      const action = determineNextBestAction(order);

      expect(action).not.toBeNull();
      expect(action!.action).toContain('Schedule delivery');
      expect(action!.urgency).toBe('TODAY');
    });

    it('returns check-in for silence > 7 days', () => {
      const order = createBaseOrder({
        lastContactDaysAgo: 10,
        status: 'BOOKING_DONE',
      });

      const action = determineNextBestAction(order);

      expect(action).not.toBeNull();
      expect(action!.action).toContain('check-in');
      expect(action!.channel).toBe('WHATSAPP');
    });

    it('returns personal call for high-value orders with > 3 days silence', () => {
      const order = createBaseOrder({
        totalAmount: 250000,
        lastContactDaysAgo: 5,
        status: 'BOOKING_DONE',
      });

      const action = determineNextBestAction(order);

      expect(action).not.toBeNull();
      expect(action!.channel).toBe('CALL');
      expect(action!.action).toContain('Personal');
    });

    it('returns default follow-up for new orders with no issues', () => {
      const order = createBaseOrder({
        status: 'NEW',
        lastContactDaysAgo: 2,
      });

      const action = determineNextBestAction(order);

      expect(action).not.toBeNull();
      expect(action!.action).toContain('Follow up');
    });

    it('returns null for delivered orders with no issues', () => {
      const order = createBaseOrder({
        status: 'DELIVERED',
        lastContactDaysAgo: 1,
      });

      const action = determineNextBestAction(order);

      expect(action).toBeNull();
    });

    it('prioritizes financing over silence', () => {
      const now = new Date();
      const order = createBaseOrder({
        financingStatus: 'PENDING',
        updatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        lastContactDaysAgo: 10, // Also has silence issue
      });

      const action = determineNextBestAction(order);

      expect(action).not.toBeNull();
      expect(action!.action).toContain('financing'); // Financing has higher priority
    });

    it('prioritizes delay escalation over regular delay notification', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);

      const order = createBaseOrder({
        expectedDeliveryDate: pastDate.toISOString(),
        status: 'READY_FOR_DELIVERY',
        activities: [
          {
            id: 'act-1',
            orderId: 'test-order',
            type: 'WHATSAPP_RECEIVED',
            channel: 'WHATSAPP',
            summary: 'Frustrated customer',
            sentiment: 'NEGATIVE',
            performedBy: 'cust-1',
            performedAt: new Date().toISOString(),
          },
        ],
      });

      const action = determineNextBestAction(order);

      expect(action!.action).toContain('concerns'); // Escalation, not just notification
    });
  });

  describe('getAllApplicableActions', () => {
    it('returns empty array for order with no applicable rules', () => {
      const order = createBaseOrder({
        status: 'DELIVERED',
        lastContactDaysAgo: 1,
      });

      const actions = getAllApplicableActions(order);

      expect(actions).toHaveLength(0);
    });

    it('returns multiple actions when multiple rules apply', () => {
      const now = new Date();
      const order = createBaseOrder({
        financingStatus: 'PENDING',
        updatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        lastContactDaysAgo: 10, // Silence rule also applies
        totalAmount: 250000, // High value rule also applies
      });

      const actions = getAllApplicableActions(order);

      expect(actions.length).toBeGreaterThan(1);
    });

    it('includes all applicable rules for complex order', () => {
      const order = createBaseOrder({
        status: 'FINANCING_APPROVED', // Vehicle arrived
        lastContactDaysAgo: 10, // Silence
        totalAmount: 250000, // High value
      });

      const actions = getAllApplicableActions(order);

      // Should have: vehicle arrived, silence, high value
      expect(actions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('NBA_RULES', () => {
    it('has unique rule IDs', () => {
      const ids = NBA_RULES.map(rule => rule.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all rules have required action properties', () => {
      NBA_RULES.forEach(rule => {
        expect(rule.action.action).toBeDefined();
        expect(rule.action.channel).toBeDefined();
        expect(rule.action.urgency).toBeDefined();
        expect(rule.action.expectedImpact).toBeDefined();
        expect(rule.action.reasoning).toBeDefined();
      });
    });

    it('has at least 5 rules for MVP', () => {
      expect(NBA_RULES.length).toBeGreaterThanOrEqual(5);
    });
  });
});
