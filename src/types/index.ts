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

// ===== TRADE-IN TYPES =====

export type TradeInStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PRICED'
  | 'ACCEPTED'
  | 'REJECTED';

export type VehicleCondition = 'excellent' | 'good' | 'fair' | 'poor';

export type PhotoType =
  | 'front_view'
  | 'rear_view'
  | 'left_side'
  | 'right_side'
  | 'dashboard'
  | 'front_seats'
  | 'rear_seats'
  | 'trunk'
  | 'engine_bay'
  | 'wheels'
  | 'additional_1'
  | 'additional_2';

export type AnnotationType = 'scratch' | 'dent' | 'wear' | 'other' | 'note';

export interface PhotoAnnotation {
  id?: string;
  x: number;
  y: number;
  type: AnnotationType;
  text?: string;
  description?: string;
}

export interface TradeInPhoto {
  id: string;
  type: PhotoType;
  url: string;
  thumbnail?: string;
  timestamp: string;
  notes?: string;
  annotations?: PhotoAnnotation[];
}

export interface OCRData {
  customerName?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleTrim?: string;
  vin?: string;
  plateNumber?: string;
  registrationYear?: number;
}

export interface RegistrationCard {
  frontImage: string;
  backImage: string;
  ocrData?: OCRData;
}

export interface VehicleDetails {
  mileage: number;
  expectedPrice: number;
  condition: VehicleCondition;
  features: string[];
  additionalNotes?: string;
}

export interface InspectorReview {
  inspectorId: string;
  reviewedAt: string;
  tentativePrice: number;
  notes?: string;
}

export interface TradeInAppraisal {
  id: string;
  status: TradeInStatus;

  // Linked entities
  leadId?: string;
  customerId: string;
  salesExecutiveId: string;

  // Step 1: Registration
  registrationCards: RegistrationCard;

  // Step 2: Vehicle Details
  vehicleDetails: VehicleDetails;

  // Step 3: Photos
  photos: TradeInPhoto[];

  // Metadata
  createdAt: string;
  submittedAt?: string;

  // Inspector fields (post-submission)
  inspectorReview?: InspectorReview;
}

// Wizard Step Types
export type WizardStepStatus = 'completed' | 'current' | 'upcoming';

export interface WizardStep {
  number: number;
  label: string;
  sublabel: string;
  status: WizardStepStatus;
}

// Condition Option Type
export interface ConditionOption {
  value: VehicleCondition;
  label: string;
  description: string;
}
