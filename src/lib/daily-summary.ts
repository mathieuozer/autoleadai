/**
 * End of Day Summary Module
 * Generates performance feedback and impact metrics
 */

export interface DailySummary {
  date: string;
  salespersonId: string;
  salespersonName: string;

  // Activity metrics
  activities: {
    callsMade: number;
    messagesSent: number;
    emailsSent: number;
    totalTouchpoints: number;
    ordersContacted: number;
  };

  // Impact metrics
  impact: {
    riskReductionPercent: number;
    ordersMovedForward: number;
    potentialRevenueSaved: number;
    cancellationsAvoided: number;
    deliveriesScheduled: number;
  };

  // Wins
  wins: DailyWin[];

  // Comparison to average
  comparison: {
    vsYesterday: number; // percentage
    vsWeekAverage: number;
    vsTeamAverage: number;
  };

  // AI-generated feedback
  feedback: string;

  // Suggested focus for tomorrow
  tomorrowFocus: TomorrowFocus[];
}

export interface DailyWin {
  type: 'delivery' | 'payment' | 'financing' | 'save' | 'upsell';
  description: string;
  value?: number;
  orderId: string;
  customerName: string;
}

export interface TomorrowFocus {
  priority: 'high' | 'medium';
  action: string;
  reason: string;
  orderId?: string;
}

// Generate end of day summary
export function generateDailySummary(
  salesperson: { id: string; name: string },
  todayActivities: Array<{
    type: string;
    orderId: string;
    customerName: string;
    result?: string;
    value?: number;
  }>,
  orderChanges: Array<{
    orderId: string;
    customerName: string;
    previousRisk: number;
    currentRisk: number;
    statusChange?: string;
    value: number;
  }>,
  yesterdayMetrics: { touchpoints: number; riskReduction: number },
  weekAverageMetrics: { touchpoints: number; riskReduction: number },
  teamAverageMetrics: { touchpoints: number; riskReduction: number },
  tomorrowPriorities: Array<{ orderId: string; action: string; urgency: string; reason: string }>
): DailySummary {

  // Calculate activity metrics
  const callsMade = todayActivities.filter(a => a.type.includes('CALL')).length;
  const messagesSent = todayActivities.filter(a => a.type.includes('WHATSAPP') || a.type.includes('SMS')).length;
  const emailsSent = todayActivities.filter(a => a.type.includes('EMAIL')).length;
  const totalTouchpoints = todayActivities.length;
  const ordersContacted = new Set(todayActivities.map(a => a.orderId)).size;

  // Calculate impact metrics
  const totalRiskReduction = orderChanges.reduce((sum, o) => {
    const reduction = o.previousRisk - o.currentRisk;
    return sum + (reduction > 0 ? reduction : 0);
  }, 0);

  const avgRiskReduction = orderChanges.length > 0
    ? totalRiskReduction / orderChanges.length
    : 0;

  const ordersMovedForward = orderChanges.filter(o => o.statusChange).length;

  const cancellationsAvoided = orderChanges.filter(o =>
    o.previousRisk > 70 && o.currentRisk < 50
  ).length;

  const potentialRevenueSaved = orderChanges
    .filter(o => o.previousRisk > 70 && o.currentRisk < 50)
    .reduce((sum, o) => sum + o.value, 0);

  const deliveriesScheduled = orderChanges.filter(o =>
    o.statusChange === 'READY_FOR_DELIVERY' || o.statusChange === 'DELIVERED'
  ).length;

  // Generate wins
  const wins: DailyWin[] = [];

  orderChanges.forEach(change => {
    if (change.statusChange === 'DELIVERED') {
      wins.push({
        type: 'delivery',
        description: `Successfully delivered vehicle to ${change.customerName}`,
        value: change.value,
        orderId: change.orderId,
        customerName: change.customerName
      });
    }
    if (change.previousRisk > 70 && change.currentRisk < 50) {
      wins.push({
        type: 'save',
        description: `Saved at-risk order for ${change.customerName} through proactive communication`,
        value: change.value,
        orderId: change.orderId,
        customerName: change.customerName
      });
    }
    if (change.statusChange === 'FINANCING_APPROVED') {
      wins.push({
        type: 'financing',
        description: `Financing approved for ${change.customerName}`,
        value: change.value,
        orderId: change.orderId,
        customerName: change.customerName
      });
    }
  });

  // Calculate comparisons
  const vsYesterday = yesterdayMetrics.touchpoints > 0
    ? ((totalTouchpoints - yesterdayMetrics.touchpoints) / yesterdayMetrics.touchpoints) * 100
    : 0;

  const vsWeekAverage = weekAverageMetrics.touchpoints > 0
    ? ((totalTouchpoints - weekAverageMetrics.touchpoints) / weekAverageMetrics.touchpoints) * 100
    : 0;

  const vsTeamAverage = teamAverageMetrics.touchpoints > 0
    ? ((totalTouchpoints - teamAverageMetrics.touchpoints) / teamAverageMetrics.touchpoints) * 100
    : 0;

  // Generate feedback
  const feedback = generateFeedback(
    totalTouchpoints,
    avgRiskReduction,
    wins.length,
    cancellationsAvoided,
    deliveriesScheduled,
    vsTeamAverage
  );

  // Tomorrow focus
  const tomorrowFocus: TomorrowFocus[] = tomorrowPriorities.slice(0, 3).map(p => ({
    priority: p.urgency === 'NOW' || p.urgency === 'TODAY' ? 'high' as const : 'medium' as const,
    action: p.action,
    reason: p.reason,
    orderId: p.orderId
  }));

  return {
    date: new Date().toISOString().split('T')[0],
    salespersonId: salesperson.id,
    salespersonName: salesperson.name,
    activities: {
      callsMade,
      messagesSent,
      emailsSent,
      totalTouchpoints,
      ordersContacted
    },
    impact: {
      riskReductionPercent: Math.round(avgRiskReduction),
      ordersMovedForward,
      potentialRevenueSaved,
      cancellationsAvoided,
      deliveriesScheduled
    },
    wins,
    comparison: {
      vsYesterday: Math.round(vsYesterday),
      vsWeekAverage: Math.round(vsWeekAverage),
      vsTeamAverage: Math.round(vsTeamAverage)
    },
    feedback,
    tomorrowFocus
  };
}

function generateFeedback(
  touchpoints: number,
  avgRiskReduction: number,
  wins: number,
  cancellationsAvoided: number,
  deliveries: number,
  vsTeamAverage: number
): string {
  const parts: string[] = [];

  // Opening based on overall performance
  if (vsTeamAverage > 20) {
    parts.push('Outstanding day! You\'re performing well above the team average.');
  } else if (vsTeamAverage > 0) {
    parts.push('Good work today! You\'re ahead of the team average.');
  } else if (touchpoints > 0) {
    parts.push('Solid effort today. Every customer touchpoint matters.');
  } else {
    parts.push('Quiet day today. Tomorrow is a fresh start!');
  }

  // Highlight key achievements
  if (cancellationsAvoided > 0) {
    parts.push(`You saved ${cancellationsAvoided} order${cancellationsAvoided > 1 ? 's' : ''} that ${cancellationsAvoided > 1 ? 'were' : 'was'} at risk of cancellation.`);
  }

  if (deliveries > 0) {
    parts.push(`${deliveries} successful deliver${deliveries > 1 ? 'ies' : 'y'} completed!`);
  }

  if (avgRiskReduction > 15) {
    parts.push(`Your proactive communication reduced order risk by ${Math.round(avgRiskReduction)}% on average.`);
  }

  // Encouragement
  if (wins > 0) {
    parts.push(`${wins} win${wins > 1 ? 's' : ''} to celebrate today!`);
  }

  return parts.join(' ');
}

// Calculate weekly performance trends
export function calculateWeeklyTrend(
  dailySummaries: DailySummary[]
): {
  touchpointsTrend: number[];
  riskReductionTrend: number[];
  winsTrend: number[];
  bestDay: string;
  improvement: number;
} {
  const touchpointsTrend = dailySummaries.map(s => s.activities.totalTouchpoints);
  const riskReductionTrend = dailySummaries.map(s => s.impact.riskReductionPercent);
  const winsTrend = dailySummaries.map(s => s.wins.length);

  const bestDayIndex = touchpointsTrend.indexOf(Math.max(...touchpointsTrend));
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const bestDay = dailySummaries[bestDayIndex]
    ? days[new Date(dailySummaries[bestDayIndex].date).getDay()]
    : 'N/A';

  // Calculate improvement from first to last day
  const firstDay = touchpointsTrend[0] || 0;
  const lastDay = touchpointsTrend[touchpointsTrend.length - 1] || 0;
  const improvement = firstDay > 0 ? ((lastDay - firstDay) / firstDay) * 100 : 0;

  return {
    touchpointsTrend,
    riskReductionTrend,
    winsTrend,
    bestDay,
    improvement: Math.round(improvement)
  };
}

// Generate motivational message based on performance
export function getMotivationalMessage(summary: DailySummary): string {
  const messages = {
    excellent: [
      'You\'re crushing it! Keep this momentum going!',
      'This is what top performers look like. Well done!',
      'Your customers are lucky to have you!'
    ],
    good: [
      'Solid day! A few more touchpoints and you\'ll be at the top.',
      'Good progress! Tomorrow, let\'s beat today\'s numbers.',
      'You\'re making a difference. Keep it up!'
    ],
    average: [
      'Every call counts. Let\'s aim higher tomorrow!',
      'Progress, not perfection. You\'ve got this!',
      'Small improvements add up. Focus on one more call tomorrow.'
    ],
    needsWork: [
      'Tomorrow is a new opportunity. Start with your highest risk orders.',
      'Let\'s reset and focus. Your pipeline needs attention.',
      'Consistency is key. Block time for customer calls tomorrow.'
    ]
  };

  let category: keyof typeof messages;

  if (summary.comparison.vsTeamAverage > 20 && summary.wins.length > 0) {
    category = 'excellent';
  } else if (summary.comparison.vsTeamAverage >= 0) {
    category = 'good';
  } else if (summary.activities.totalTouchpoints > 3) {
    category = 'average';
  } else {
    category = 'needsWork';
  }

  const categoryMessages = messages[category];
  return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
}
