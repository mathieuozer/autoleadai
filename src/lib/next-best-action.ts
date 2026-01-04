import { Order, NextBestAction, Channel, Urgency } from '@/types';

export interface NBARule {
  id: string;
  name: string;
  priority: number; // Lower is higher priority
  condition: (order: Order) => boolean;
  action: NextBestAction;
}

/**
 * Get the most recent activity sentiment
 */
function getLatestSentiment(order: Order): string | null {
  if (!order.activities || order.activities.length === 0) return null;

  const activitiesWithSentiment = order.activities
    .filter(a => a.sentiment)
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());

  return activitiesWithSentiment.length > 0 ? activitiesWithSentiment[0].sentiment || null : null;
}

/**
 * Check if delivery is delayed
 */
function isDeliveryDelayed(order: Order): boolean {
  if (!order.expectedDeliveryDate) return false;
  return new Date(order.expectedDeliveryDate) < new Date();
}

/**
 * Calculate days since financing became pending
 */
function getFinancingPendingDays(order: Order): number {
  if (order.financingStatus !== 'PENDING') return 0;
  const updatedAt = new Date(order.updatedAt);
  const now = new Date();
  return Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check if vehicle has arrived (ready for delivery)
 */
function isVehicleArrived(order: Order): boolean {
  return order.status === 'FINANCING_APPROVED' || order.status === 'READY_FOR_DELIVERY';
}

/**
 * Check if this is a high-value order
 */
function isHighValueOrder(order: Order, threshold: number = 200000): boolean {
  return order.totalAmount >= threshold;
}

/**
 * NBA Rules based on ARCHITECTURE.md
 * Priority 1 is highest (most urgent)
 */
export const NBA_RULES: NBARule[] = [
  {
    id: 'financing-followup',
    name: 'Financing Follow-up',
    priority: 1,
    condition: (order) => getFinancingPendingDays(order) > 2,
    action: {
      action: 'Call customer about financing status',
      channel: 'CALL',
      urgency: 'TODAY',
      suggestedMessage: 'Hi, I wanted to follow up on your financing application. Do you have a few minutes to discuss?',
      expectedImpact: 'Approval probability drops 23% after day 3',
      reasoning: 'Financing has been pending for over 2 days. Proactive follow-up prevents customer from going cold or seeking alternatives.',
    },
  },
  {
    id: 'delivery-delay-notification',
    name: 'Delivery Delay Notification',
    priority: 2,
    condition: (order) => isDeliveryDelayed(order) && getLatestSentiment(order) !== 'NEGATIVE',
    action: {
      action: 'Send proactive delivery update',
      channel: 'WHATSAPP',
      urgency: 'NOW',
      suggestedMessage: 'Hello! I wanted to update you on your vehicle delivery. We\'re working to get your car ready as quickly as possible. I\'ll keep you posted on the exact timing.',
      expectedImpact: 'Reduces cancellation risk by 18%',
      reasoning: 'Delivery is delayed. Proactive communication prevents customer frustration and cancellation.',
    },
  },
  {
    id: 'delivery-delay-escalation',
    name: 'Delivery Delay Escalation',
    priority: 1,
    condition: (order) => isDeliveryDelayed(order) && getLatestSentiment(order) === 'NEGATIVE',
    action: {
      action: 'Call customer to address concerns',
      channel: 'CALL',
      urgency: 'NOW',
      suggestedMessage: 'I understand the delay is frustrating. Let me personally ensure we get this resolved for you.',
      expectedImpact: 'Prevents imminent cancellation',
      reasoning: 'Customer has expressed dissatisfaction about the delay. Personal call is needed to de-escalate.',
    },
  },
  {
    id: 'vehicle-arrived-schedule',
    name: 'Vehicle Arrived - Schedule Delivery',
    priority: 2,
    condition: (order) => isVehicleArrived(order) && order.status !== 'DELIVERED',
    action: {
      action: 'Schedule delivery and offer accessories',
      channel: 'CALL',
      urgency: 'TODAY',
      suggestedMessage: 'Great news! Your vehicle is ready. When would be a good time for delivery? Also, we have some accessories that would complement your new car.',
      expectedImpact: 'Closes order faster, upsell opportunity',
      reasoning: 'Vehicle is ready for delivery. Quick scheduling maximizes customer satisfaction and upsell potential.',
    },
  },
  {
    id: 'silence-checkin',
    name: 'Silence Check-in',
    priority: 3,
    condition: (order) => order.lastContactDaysAgo > 7,
    action: {
      action: 'Send check-in message',
      channel: 'WHATSAPP',
      urgency: 'TODAY',
      suggestedMessage: 'Hi! Just checking in to see how everything is going. Is there anything I can help you with?',
      expectedImpact: 'Re-engages customer before they go cold',
      reasoning: 'No contact for over 7 days. Customer may be losing interest or exploring alternatives.',
    },
  },
  {
    id: 'high-value-personal',
    name: 'High-Value Personal Attention',
    priority: 4,
    condition: (order) => isHighValueOrder(order) && order.lastContactDaysAgo > 3,
    action: {
      action: 'Personal call for premium service',
      channel: 'CALL',
      urgency: 'THIS_WEEK',
      suggestedMessage: 'I wanted to personally check in and ensure everything is going smoothly with your order. Is there anything specific I can assist you with?',
      expectedImpact: 'High-value customers expect premium service',
      reasoning: 'High-value order deserves personal attention. A call shows commitment to their satisfaction.',
    },
  },
];

/**
 * Determine the best action for an order
 */
export function determineNextBestAction(order: Order): NextBestAction | null {
  // Sort rules by priority (lower number = higher priority)
  const sortedRules = [...NBA_RULES].sort((a, b) => a.priority - b.priority);

  // Find first matching rule
  for (const rule of sortedRules) {
    if (rule.condition(order)) {
      return rule.action;
    }
  }

  // Default action if no rules match
  if (order.status === 'NEW' || order.status === 'CONTACTED') {
    return {
      action: 'Follow up on order progress',
      channel: order.customer.preferredChannel || 'WHATSAPP',
      urgency: 'THIS_WEEK',
      expectedImpact: 'Keeps deal moving forward',
      reasoning: 'Regular follow-up maintains momentum on the deal.',
    };
  }

  return null;
}

/**
 * Get all applicable actions for an order (for display purposes)
 */
export function getAllApplicableActions(order: Order): NextBestAction[] {
  const actions: NextBestAction[] = [];

  for (const rule of NBA_RULES) {
    if (rule.condition(order)) {
      actions.push(rule.action);
    }
  }

  return actions;
}

/**
 * Get urgency priority for sorting
 */
export function getUrgencyPriority(urgency: Urgency): number {
  switch (urgency) {
    case 'NOW':
      return 1;
    case 'TODAY':
      return 2;
    case 'THIS_WEEK':
      return 3;
    default:
      return 4;
  }
}
