/**
 * AI Sales Coaching Module
 * Provides talk-track suggestions, performance benchmarking, and personalized insights
 */

export interface TalkTrack {
  id: string;
  scenario: string;
  context: string;
  suggestedScript: string;
  tips: string[];
  expectedOutcome: string;
  successRate: number; // Historical success rate for this talk track
}

export interface PerformanceBenchmark {
  metric: string;
  yourValue: number;
  teamAverage: number;
  topPerformer: number;
  percentile: number;
  trend: 'improving' | 'stable' | 'declining';
  insight: string;
}

export interface CoachingInsight {
  id: string;
  type: 'strength' | 'improvement' | 'opportunity';
  title: string;
  description: string;
  actionable: string;
  impact: 'high' | 'medium' | 'low';
  relatedMetric?: string;
}

export interface DailyCoachingTip {
  tip: string;
  category: 'communication' | 'timing' | 'objection_handling' | 'closing' | 'follow_up';
  relevance: string;
}

// Talk track templates for common scenarios
export const TALK_TRACKS: Record<string, TalkTrack> = {
  delivery_delay: {
    id: 'delivery_delay',
    scenario: 'Delivery Delay Notification',
    context: 'When vehicle delivery is delayed and customer needs to be informed proactively',
    suggestedScript: `Hi [Customer Name], this is [Your Name] from [Dealership]. I wanted to personally update you on your [Vehicle] order.

I know you're excited to receive your new car, and I want to be completely transparent with you. We've received an update that the delivery has been adjusted to [New Date].

The reason for this is [Reason - e.g., shipping logistics, final quality checks]. I want to assure you that we're doing everything possible to expedite this, and your vehicle is being given the highest priority.

In the meantime, is there anything I can help you with? I'd also like to offer [Compensation - e.g., complimentary service package, extended warranty].

Thank you for your patience. I'll personally keep you updated every step of the way.`,
    tips: [
      'Call, don\'t text - shows you care',
      'Be proactive - don\'t wait for them to call',
      'Offer something tangible as goodwill',
      'Give a specific new date, not a range',
      'Follow up with written confirmation'
    ],
    expectedOutcome: 'Customer feels valued and informed, reducing cancellation risk',
    successRate: 78
  },
  financing_follow_up: {
    id: 'financing_follow_up',
    scenario: 'Financing Application Follow-up',
    context: 'When financing application is pending for more than 48 hours',
    suggestedScript: `Hi [Customer Name], this is [Your Name]. I'm following up on your financing application for the [Vehicle].

I wanted to check if you've had a chance to submit all the required documents? Sometimes applications get delayed because of [common issues: missing income proof, unclear bank statements, etc.].

I can help you right now if there's anything holding you up. Would you like me to walk you through what's needed? I'm also happy to connect you with our finance manager who can answer any questions.

The sooner we complete this, the sooner we can lock in your delivery date!`,
    tips: [
      'Call within 48 hours of application',
      'Offer to help, not just remind',
      'Know the common documentation issues',
      'Create urgency around delivery timeline',
      'Have finance manager available for complex questions'
    ],
    expectedOutcome: 'Faster application completion, higher approval rates',
    successRate: 82
  },
  silence_break: {
    id: 'silence_break',
    scenario: 'Breaking Customer Silence',
    context: 'When there\'s been no contact with customer for 7+ days',
    suggestedScript: `Hi [Customer Name], this is [Your Name] from [Dealership]. I hope you're doing well!

I realized we haven't connected in a few days, and I wanted to check in on you. I know purchasing a car is a big decision, and I want to make sure you have everything you need.

Is there anything on your mind about the [Vehicle]? Any questions I can answer or concerns I can address?

I'm here to help, no pressure at all. Just want to make sure you're taken care of.`,
    tips: [
      'Keep it light and friendly, not pushy',
      'Show genuine interest, not just sales intent',
      'Ask open-ended questions',
      'Be ready to address common hesitations',
      'Offer a no-pressure next step'
    ],
    expectedOutcome: 'Re-engagement and understanding of customer hesitations',
    successRate: 65
  },
  vehicle_arrived: {
    id: 'vehicle_arrived',
    scenario: 'Vehicle Arrived in Yard',
    context: 'When the customer\'s vehicle has arrived and is ready for delivery',
    suggestedScript: `Great news, [Customer Name]! Your [Vehicle] has arrived and it looks absolutely stunning!

I personally inspected it and everything is perfect. I'm so excited for you to see it.

Let's schedule your delivery. What works better for you - [Date Option 1] or [Date Option 2]? I'd recommend [morning/afternoon] as it gives us plenty of time to walk you through all the features.

Also, I wanted to mention we have some great accessories that would complement your new car beautifully. Would you like me to share some options when you come in?`,
    tips: [
      'Share genuine excitement',
      'Offer limited date options (not open-ended)',
      'Mention personal inspection for trust',
      'Introduce upsell naturally',
      'Confirm all paperwork is ready'
    ],
    expectedOutcome: 'Quick delivery scheduling and accessory upsell opportunity',
    successRate: 91
  },
  objection_price: {
    id: 'objection_price',
    scenario: 'Price Objection Handling',
    context: 'When customer says the price is too high or asks for discount',
    suggestedScript: `I completely understand, [Customer Name]. Price is an important factor, and you want to make sure you're getting the best value.

Let me share what makes this particular [Vehicle] worth the investment:
- [Feature 1 with benefit]
- [Feature 2 with benefit]
- [Included services/warranty]

When you factor in [resale value / total cost of ownership / included features], you're actually getting excellent value.

That said, let me see what I can do for you. [Mention any current promotions or check with manager]. Would that work for you?`,
    tips: [
      'Never dismiss the concern',
      'Reframe from price to value',
      'Know your vehicle\'s unique selling points',
      'Have manager-approved flexibility range ready',
      'Create urgency with limited-time offers'
    ],
    expectedOutcome: 'Shift focus from price to value, maintain deal momentum',
    successRate: 72
  },
  trade_in_discussion: {
    id: 'trade_in_discussion',
    scenario: 'Trade-in Value Discussion',
    context: 'When discussing trade-in value with customer',
    suggestedScript: `[Customer Name], I've reviewed the appraisal for your [Current Vehicle] and I want to walk you through how we arrived at the value.

Based on the current market, similar vehicles in [condition] are trading at [range]. Your vehicle has [positive points], which is great. We've valued it at [Amount].

This brings your net cost for the new [Vehicle] to [Amount], which I think is a very fair deal.

What are your thoughts? I want to make sure you feel good about this.`,
    tips: [
      'Be transparent about valuation method',
      'Highlight positives about their vehicle',
      'Show market comparisons if possible',
      'Focus on the net deal, not just trade value',
      'Be prepared for negotiation'
    ],
    expectedOutcome: 'Smooth trade-in acceptance, faster deal closure',
    successRate: 75
  }
};

// Generate personalized coaching insights based on salesperson data
export function generateCoachingInsights(
  performanceData: {
    conversionRate: number;
    avgResponseTime: number; // in hours
    followUpRate: number;
    customerSatisfaction: number;
    avgDealSize: number;
    cancellationRate: number;
  },
  teamBenchmarks: {
    avgConversionRate: number;
    avgResponseTime: number;
    avgFollowUpRate: number;
    avgCustomerSatisfaction: number;
    avgDealSize: number;
    avgCancellationRate: number;
  }
): CoachingInsight[] {
  const insights: CoachingInsight[] = [];

  // Response time insight
  if (performanceData.avgResponseTime > teamBenchmarks.avgResponseTime * 1.2) {
    insights.push({
      id: 'response_time',
      type: 'improvement',
      title: 'Speed Up Your Response Time',
      description: `Your average response time is ${performanceData.avgResponseTime.toFixed(1)} hours, while top performers respond in ${(teamBenchmarks.avgResponseTime * 0.7).toFixed(1)} hours.`,
      actionable: 'Set up mobile notifications for new leads. Aim to respond within 1 hour during business hours.',
      impact: 'high',
      relatedMetric: 'Response Time'
    });
  } else if (performanceData.avgResponseTime < teamBenchmarks.avgResponseTime * 0.8) {
    insights.push({
      id: 'response_time',
      type: 'strength',
      title: 'Excellent Response Time',
      description: `You respond ${((1 - performanceData.avgResponseTime / teamBenchmarks.avgResponseTime) * 100).toFixed(0)}% faster than the team average!`,
      actionable: 'Keep it up! Quick responses significantly improve conversion rates.',
      impact: 'high',
      relatedMetric: 'Response Time'
    });
  }

  // Follow-up rate insight
  if (performanceData.followUpRate < teamBenchmarks.avgFollowUpRate * 0.9) {
    insights.push({
      id: 'follow_up',
      type: 'improvement',
      title: 'Increase Follow-up Frequency',
      description: `You follow up on ${(performanceData.followUpRate * 100).toFixed(0)}% of leads, but top performers follow up on ${(teamBenchmarks.avgFollowUpRate * 100 * 1.1).toFixed(0)}%.`,
      actionable: 'Schedule dedicated follow-up time each day. Use the AI recommendations to prioritize who to contact.',
      impact: 'high',
      relatedMetric: 'Follow-up Rate'
    });
  }

  // Conversion rate insight
  if (performanceData.conversionRate > teamBenchmarks.avgConversionRate * 1.1) {
    insights.push({
      id: 'conversion',
      type: 'strength',
      title: 'Strong Conversion Rate',
      description: `Your ${(performanceData.conversionRate * 100).toFixed(1)}% conversion rate is above the team average!`,
      actionable: 'Consider mentoring newer team members on your closing techniques.',
      impact: 'high',
      relatedMetric: 'Conversion Rate'
    });
  } else if (performanceData.conversionRate < teamBenchmarks.avgConversionRate * 0.9) {
    insights.push({
      id: 'conversion',
      type: 'improvement',
      title: 'Opportunity to Improve Conversions',
      description: `Your conversion rate is ${((1 - performanceData.conversionRate / teamBenchmarks.avgConversionRate) * 100).toFixed(0)}% below team average.`,
      actionable: 'Review the objection handling talk tracks and practice with a colleague.',
      impact: 'high',
      relatedMetric: 'Conversion Rate'
    });
  }

  // Cancellation rate insight
  if (performanceData.cancellationRate > teamBenchmarks.avgCancellationRate * 1.2) {
    insights.push({
      id: 'cancellation',
      type: 'improvement',
      title: 'Reduce Order Cancellations',
      description: `Your cancellation rate of ${(performanceData.cancellationRate * 100).toFixed(1)}% is higher than average. This represents lost revenue.`,
      actionable: 'Focus on proactive communication, especially during delivery delays. Use the delivery delay talk track.',
      impact: 'high',
      relatedMetric: 'Cancellation Rate'
    });
  }

  // Deal size opportunity
  if (performanceData.avgDealSize < teamBenchmarks.avgDealSize * 0.95) {
    insights.push({
      id: 'deal_size',
      type: 'opportunity',
      title: 'Upsell Opportunity',
      description: `Your average deal size is ${((1 - performanceData.avgDealSize / teamBenchmarks.avgDealSize) * 100).toFixed(0)}% below team average.`,
      actionable: 'Mention accessories and add-ons naturally during vehicle delivery. Customers are most receptive at this stage.',
      impact: 'medium',
      relatedMetric: 'Average Deal Size'
    });
  }

  // Customer satisfaction
  if (performanceData.customerSatisfaction >= 4.5) {
    insights.push({
      id: 'satisfaction',
      type: 'strength',
      title: 'Outstanding Customer Satisfaction',
      description: `Your ${performanceData.customerSatisfaction.toFixed(1)}/5 rating shows customers love working with you!`,
      actionable: 'Ask satisfied customers for referrals. They\'re your best source of new leads.',
      impact: 'medium',
      relatedMetric: 'Customer Satisfaction'
    });
  }

  return insights;
}

// Generate performance benchmarks
export function generateBenchmarks(
  yourData: {
    conversionRate: number;
    avgResponseTime: number;
    followUpRate: number;
    customerSatisfaction: number;
    ordersThisMonth: number;
    revenueThisMonth: number;
  },
  teamData: {
    avgConversionRate: number;
    avgResponseTime: number;
    avgFollowUpRate: number;
    avgCustomerSatisfaction: number;
    topConversionRate: number;
    topResponseTime: number;
    topOrdersThisMonth: number;
    topRevenueThisMonth: number;
  }
): PerformanceBenchmark[] {
  return [
    {
      metric: 'Conversion Rate',
      yourValue: yourData.conversionRate * 100,
      teamAverage: teamData.avgConversionRate * 100,
      topPerformer: teamData.topConversionRate * 100,
      percentile: calculatePercentile(yourData.conversionRate, teamData.avgConversionRate, teamData.topConversionRate),
      trend: yourData.conversionRate > teamData.avgConversionRate ? 'improving' : 'stable',
      insight: yourData.conversionRate > teamData.avgConversionRate
        ? 'You\'re closing deals better than most!'
        : 'Focus on objection handling to improve'
    },
    {
      metric: 'Response Time',
      yourValue: yourData.avgResponseTime,
      teamAverage: teamData.avgResponseTime,
      topPerformer: teamData.topResponseTime,
      percentile: calculatePercentile(teamData.avgResponseTime, yourData.avgResponseTime, teamData.topResponseTime), // Lower is better
      trend: yourData.avgResponseTime < teamData.avgResponseTime ? 'improving' : 'declining',
      insight: yourData.avgResponseTime < teamData.avgResponseTime
        ? 'Quick responses help win deals!'
        : 'Try to respond within 1 hour'
    },
    {
      metric: 'Follow-up Rate',
      yourValue: yourData.followUpRate * 100,
      teamAverage: teamData.avgFollowUpRate * 100,
      topPerformer: 95,
      percentile: calculatePercentile(yourData.followUpRate, teamData.avgFollowUpRate, 0.95),
      trend: 'stable',
      insight: 'Consistent follow-ups build trust'
    },
    {
      metric: 'Customer Rating',
      yourValue: yourData.customerSatisfaction,
      teamAverage: teamData.avgCustomerSatisfaction,
      topPerformer: 5.0,
      percentile: calculatePercentile(yourData.customerSatisfaction, teamData.avgCustomerSatisfaction, 5.0),
      trend: yourData.customerSatisfaction >= 4.5 ? 'improving' : 'stable',
      insight: yourData.customerSatisfaction >= 4.5
        ? 'Customers love working with you!'
        : 'Small gestures make big differences'
    }
  ];
}

function calculatePercentile(value: number, average: number, top: number): number {
  if (value >= top) return 99;
  if (value <= average * 0.5) return 10;

  const range = top - average * 0.5;
  const position = value - average * 0.5;
  return Math.round((position / range) * 100);
}

// Daily coaching tip generator
export function getDailyCoachingTip(): DailyCoachingTip {
  const tips: DailyCoachingTip[] = [
    {
      tip: 'Start your day by reviewing your high-risk orders first. A proactive call can save a deal.',
      category: 'timing',
      relevance: 'Reduces cancellation risk by 24%'
    },
    {
      tip: 'When a customer says "I need to think about it," ask "What specifically would help you decide?"',
      category: 'objection_handling',
      relevance: 'Uncovers hidden objections'
    },
    {
      tip: 'Send a thank-you message within 24 hours of test drive. Personalize it with something specific they liked.',
      category: 'follow_up',
      relevance: 'Increases conversion by 18%'
    },
    {
      tip: 'Never end a call without scheduling the next touchpoint. "I\'ll call you Tuesday at 2pm" is better than "I\'ll follow up soon."',
      category: 'communication',
      relevance: 'Keeps deals moving forward'
    },
    {
      tip: 'When discussing price, always redirect to value. "Let me show you what makes this worth every dirham."',
      category: 'closing',
      relevance: 'Protects margins while building trust'
    },
    {
      tip: 'The best time to ask for referrals is right after delivery when excitement is highest.',
      category: 'closing',
      relevance: 'Referrals have 4x higher conversion'
    },
    {
      tip: 'If a customer goes silent, call (don\'t text). It shows you care and makes it harder to ignore.',
      category: 'communication',
      relevance: 'Re-engagement rate 3x higher with calls'
    },
    {
      tip: 'Keep track of personal details customers share. Asking "How was your son\'s graduation?" builds loyalty.',
      category: 'communication',
      relevance: 'Builds lasting relationships'
    }
  ];

  // Return a tip based on day of week for consistency
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return tips[dayOfYear % tips.length];
}

// Get talk track for a specific scenario
export function getTalkTrack(scenario: keyof typeof TALK_TRACKS): TalkTrack | null {
  return TALK_TRACKS[scenario] || null;
}

// Get relevant talk tracks based on order context
export function getRelevantTalkTracks(orderContext: {
  hasDeliveryDelay: boolean;
  financingPending: boolean;
  daysSinceContact: number;
  vehicleInYard: boolean;
  hasTradeIn: boolean;
}): TalkTrack[] {
  const relevant: TalkTrack[] = [];

  if (orderContext.hasDeliveryDelay) {
    relevant.push(TALK_TRACKS.delivery_delay);
  }
  if (orderContext.financingPending) {
    relevant.push(TALK_TRACKS.financing_follow_up);
  }
  if (orderContext.daysSinceContact > 5) {
    relevant.push(TALK_TRACKS.silence_break);
  }
  if (orderContext.vehicleInYard) {
    relevant.push(TALK_TRACKS.vehicle_arrived);
  }
  if (orderContext.hasTradeIn) {
    relevant.push(TALK_TRACKS.trade_in_discussion);
  }

  return relevant;
}
