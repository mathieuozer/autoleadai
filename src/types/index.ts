// Core Types for AutoLead.ai

export type OrderStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'TEST_DRIVE_SCHEDULED'
  | 'TEST_DRIVE_DONE'
  | 'NEGOTIATION'
  | 'BOOKING_DONE'
  | 'FINANCING_PENDING'
  | 'FINANCING_APPROVED'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type OrderSource = 'WALK_IN' | 'WHATSAPP' | 'WEBSITE' | 'PHONE' | 'REFERRAL';

export type FinancingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CASH';

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type Channel = 'CALL' | 'WHATSAPP' | 'EMAIL' | 'IN_PERSON' | 'SYSTEM';

export type Urgency = 'NOW' | 'TODAY' | 'THIS_WEEK';

export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

export type ActivityType =
  | 'CALL_OUTBOUND'
  | 'CALL_INBOUND'
  | 'WHATSAPP_SENT'
  | 'WHATSAPP_RECEIVED'
  | 'EMAIL_SENT'
  | 'EMAIL_RECEIVED'
  | 'VISIT'
  | 'TEST_DRIVE'
  | 'STATUS_CHANGE'
  | 'NOTE';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  preferredChannel?: Channel;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  variant?: string;
  year: number;
  color?: string;
  vin?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'SALESPERSON' | 'SALES_EXECUTIVE' | 'BRANCH_MANAGER' | 'CONTACT_CENTER' | 'ADMIN';
  avatar?: string;
}

export interface Order {
  id: string;
  customerId: string;
  vehicleId: string;
  status: OrderStatus;
  source: OrderSource;

  // Dates
  createdAt: string;
  updatedAt: string;
  expectedDeliveryDate?: string;

  // Financial
  totalAmount: number;
  bookingAmount?: number;
  financingStatus: FinancingStatus;

  // AI Fields (computed)
  riskScore: number;
  fulfillmentProbability: number;
  priorityRank?: number;
  lastContactDaysAgo: number;

  // Relations
  customer: Customer;
  vehicle: Vehicle;
  activities?: Activity[];
  salesperson?: User;
}

export interface Activity {
  id: string;
  orderId: string;
  type: ActivityType;
  channel: Channel;

  // Content
  summary: string;
  details?: string;
  sentiment?: Sentiment;

  // Meta
  performedBy: string;
  performedAt: string;
  duration?: number;

  // AI-generated
  aiSummary?: string;
  nextActionSuggested?: string;
}

export interface RiskFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface NextBestAction {
  action: string;
  channel: Channel;
  urgency: Urgency;
  suggestedMessage?: string;
  expectedImpact: string;
  reasoning: string;
}

export interface PriorityItem {
  id: string;
  orderId: string;
  order: Order;

  // Priority
  rank: number;
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];

  // Recommendation
  nextBestAction: NextBestAction;

  // Meta
  generatedAt: string;
  expiresAt: string;
}

export interface PriorityListSummary {
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  totalActions: number;
}

export interface PriorityList {
  date: string;
  generatedAt: string;
  summary: PriorityListSummary;
  items: PriorityItem[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
