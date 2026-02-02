/**
 * Financing Module
 * Handles financing applications, calculations, and status tracking
 */

export type FinancingType = 'CASH' | 'BANK_FINANCE' | 'IN_HOUSE_FINANCE' | 'LEASE';
export type FinancingStatus = 'NOT_STARTED' | 'DOCUMENTS_PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface FinancingApplication {
  id: string;
  orderId: string;
  customerId: string;
  type: FinancingType;
  status: FinancingStatus;

  // Loan details
  vehiclePrice: number;
  downPayment: number;
  loanAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;

  // Bank details (for bank finance)
  bankName?: string;
  bankBranch?: string;

  // Application tracking
  applicationDate: Date;
  documentsSubmittedAt?: Date;
  reviewStartedAt?: Date;
  decisionAt?: Date;
  expiresAt?: Date;

  // Documents
  documentsRequired: FinancingDocument[];
  documentsSubmitted: FinancingDocument[];

  // Decision
  approvedAmount?: number;
  approvedRate?: number;
  rejectionReason?: string;

  // Notes
  notes: string[];
}

export interface FinancingDocument {
  type: DocumentType;
  name: string;
  required: boolean;
  submitted: boolean;
  submittedAt?: Date;
  verified: boolean;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export type DocumentType =
  | 'EMIRATES_ID'
  | 'PASSPORT'
  | 'VISA'
  | 'SALARY_CERTIFICATE'
  | 'BANK_STATEMENT'
  | 'TRADE_LICENSE'
  | 'VAT_CERTIFICATE'
  | 'COMPANY_PROFILE'
  | 'PROOF_OF_ADDRESS'
  | 'VEHICLE_REGISTRATION';

export interface FinancingCalculation {
  vehiclePrice: number;
  downPayment: number;
  downPaymentPercent: number;
  loanAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  processingFee: number;
  insuranceRequired: number;
}

export interface FinancingBank {
  id: string;
  name: string;
  logo?: string;
  minDownPayment: number; // percentage
  maxTerm: number; // months
  interestRateFrom: number;
  interestRateTo: number;
  processingFee: number; // percentage
  features: string[];
  documentsRequired: DocumentType[];
  approvalTime: string; // e.g., "2-3 business days"
}

// Available banks for financing
export const FINANCING_BANKS: FinancingBank[] = [
  {
    id: 'emirates_nbd',
    name: 'Emirates NBD',
    minDownPayment: 20,
    maxTerm: 60,
    interestRateFrom: 2.49,
    interestRateTo: 4.99,
    processingFee: 1,
    features: ['Quick approval', 'Flexible terms', 'No salary transfer required'],
    documentsRequired: ['EMIRATES_ID', 'SALARY_CERTIFICATE', 'BANK_STATEMENT'],
    approvalTime: '2-3 business days'
  },
  {
    id: 'adcb',
    name: 'ADCB',
    minDownPayment: 20,
    maxTerm: 60,
    interestRateFrom: 2.75,
    interestRateTo: 5.25,
    processingFee: 1,
    features: ['Competitive rates', 'Easy documentation', 'Pre-approval available'],
    documentsRequired: ['EMIRATES_ID', 'PASSPORT', 'SALARY_CERTIFICATE', 'BANK_STATEMENT'],
    approvalTime: '3-5 business days'
  },
  {
    id: 'dib',
    name: 'Dubai Islamic Bank',
    minDownPayment: 20,
    maxTerm: 60,
    interestRateFrom: 2.99,
    interestRateTo: 4.99,
    processingFee: 1,
    features: ['Sharia compliant', 'No early settlement fee', 'Takaful insurance included'],
    documentsRequired: ['EMIRATES_ID', 'SALARY_CERTIFICATE', 'BANK_STATEMENT'],
    approvalTime: '2-4 business days'
  },
  {
    id: 'fab',
    name: 'First Abu Dhabi Bank',
    minDownPayment: 15,
    maxTerm: 60,
    interestRateFrom: 2.49,
    interestRateTo: 4.75,
    processingFee: 1,
    features: ['Lowest down payment', 'Fast processing', 'Multiple insurance options'],
    documentsRequired: ['EMIRATES_ID', 'PASSPORT', 'VISA', 'SALARY_CERTIFICATE', 'BANK_STATEMENT'],
    approvalTime: '1-2 business days'
  },
  {
    id: 'mashreq',
    name: 'Mashreq Bank',
    minDownPayment: 20,
    maxTerm: 48,
    interestRateFrom: 2.99,
    interestRateTo: 5.49,
    processingFee: 1.25,
    features: ['Instant pre-approval', 'Salary transfer benefits', 'Free insurance year 1'],
    documentsRequired: ['EMIRATES_ID', 'SALARY_CERTIFICATE', 'BANK_STATEMENT', 'PROOF_OF_ADDRESS'],
    approvalTime: '1-3 business days'
  }
];

// Calculate financing details
export function calculateFinancing(
  vehiclePrice: number,
  downPaymentPercent: number,
  interestRate: number,
  termMonths: number,
  processingFeePercent: number = 1
): FinancingCalculation {
  const downPayment = vehiclePrice * (downPaymentPercent / 100);
  const loanAmount = vehiclePrice - downPayment;
  const processingFee = loanAmount * (processingFeePercent / 100);

  // Calculate monthly payment using amortization formula
  const monthlyRate = interestRate / 100 / 12;
  let monthlyPayment: number;

  if (monthlyRate === 0) {
    monthlyPayment = loanAmount / termMonths;
  } else {
    monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);
  }

  const totalPayment = monthlyPayment * termMonths;
  const totalInterest = totalPayment - loanAmount;

  // Insurance estimate (roughly 3% of vehicle price per year)
  const insuranceRequired = vehiclePrice * 0.03 * (termMonths / 12);

  return {
    vehiclePrice,
    downPayment: Math.round(downPayment),
    downPaymentPercent,
    loanAmount: Math.round(loanAmount),
    interestRate,
    termMonths,
    monthlyPayment: Math.round(monthlyPayment),
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment),
    processingFee: Math.round(processingFee),
    insuranceRequired: Math.round(insuranceRequired)
  };
}

// Get required documents based on customer type
export function getRequiredDocuments(
  customerType: 'salaried' | 'self_employed' | 'company'
): FinancingDocument[] {
  const baseDocuments: FinancingDocument[] = [
    { type: 'EMIRATES_ID', name: 'Emirates ID (front & back)', required: true, submitted: false, verified: false },
    { type: 'PASSPORT', name: 'Passport copy', required: true, submitted: false, verified: false },
  ];

  if (customerType === 'salaried') {
    return [
      ...baseDocuments,
      { type: 'VISA', name: 'Visa page', required: true, submitted: false, verified: false },
      { type: 'SALARY_CERTIFICATE', name: 'Salary certificate (not older than 30 days)', required: true, submitted: false, verified: false },
      { type: 'BANK_STATEMENT', name: 'Bank statement (last 3 months)', required: true, submitted: false, verified: false },
    ];
  }

  if (customerType === 'self_employed') {
    return [
      ...baseDocuments,
      { type: 'TRADE_LICENSE', name: 'Trade license', required: true, submitted: false, verified: false },
      { type: 'BANK_STATEMENT', name: 'Bank statement (last 6 months)', required: true, submitted: false, verified: false },
      { type: 'VAT_CERTIFICATE', name: 'VAT certificate (if applicable)', required: false, submitted: false, verified: false },
    ];
  }

  // Company
  return [
    ...baseDocuments,
    { type: 'TRADE_LICENSE', name: 'Trade license', required: true, submitted: false, verified: false },
    { type: 'COMPANY_PROFILE', name: 'Company profile', required: true, submitted: false, verified: false },
    { type: 'BANK_STATEMENT', name: 'Company bank statement (last 6 months)', required: true, submitted: false, verified: false },
    { type: 'VAT_CERTIFICATE', name: 'VAT certificate', required: true, submitted: false, verified: false },
  ];
}

// Calculate approval probability based on application data
export function calculateApprovalProbability(
  monthlyIncome: number,
  monthlyPayment: number,
  existingEMIs: number,
  employmentYears: number,
  downPaymentPercent: number
): { probability: number; factors: Array<{ factor: string; impact: 'positive' | 'negative' | 'neutral'; description: string }> } {
  let probability = 70; // Base probability
  const factors: Array<{ factor: string; impact: 'positive' | 'negative' | 'neutral'; description: string }> = [];

  // Debt-to-income ratio
  const dti = ((monthlyPayment + existingEMIs) / monthlyIncome) * 100;

  if (dti < 30) {
    probability += 15;
    factors.push({
      factor: 'Debt-to-Income Ratio',
      impact: 'positive',
      description: `Excellent DTI of ${dti.toFixed(0)}% (below 30%)`
    });
  } else if (dti < 50) {
    probability += 5;
    factors.push({
      factor: 'Debt-to-Income Ratio',
      impact: 'neutral',
      description: `Acceptable DTI of ${dti.toFixed(0)}%`
    });
  } else {
    probability -= 20;
    factors.push({
      factor: 'Debt-to-Income Ratio',
      impact: 'negative',
      description: `High DTI of ${dti.toFixed(0)}% may affect approval`
    });
  }

  // Employment stability
  if (employmentYears >= 2) {
    probability += 10;
    factors.push({
      factor: 'Employment Stability',
      impact: 'positive',
      description: `${employmentYears}+ years with current employer`
    });
  } else if (employmentYears >= 1) {
    factors.push({
      factor: 'Employment Stability',
      impact: 'neutral',
      description: 'Meets minimum employment requirement'
    });
  } else {
    probability -= 15;
    factors.push({
      factor: 'Employment Stability',
      impact: 'negative',
      description: 'Less than 1 year with current employer'
    });
  }

  // Down payment
  if (downPaymentPercent >= 30) {
    probability += 10;
    factors.push({
      factor: 'Down Payment',
      impact: 'positive',
      description: `Strong down payment of ${downPaymentPercent}%`
    });
  } else if (downPaymentPercent >= 20) {
    factors.push({
      factor: 'Down Payment',
      impact: 'neutral',
      description: 'Standard down payment'
    });
  } else {
    probability -= 10;
    factors.push({
      factor: 'Down Payment',
      impact: 'negative',
      description: 'Low down payment may require additional documentation'
    });
  }

  return {
    probability: Math.min(95, Math.max(20, probability)),
    factors
  };
}

// Get financing status timeline
export function getFinancingTimeline(application: FinancingApplication): Array<{
  step: string;
  status: 'completed' | 'current' | 'pending';
  date?: Date;
  description: string;
}> {
  const timeline: Array<{
    step: string;
    status: 'completed' | 'current' | 'pending';
    date?: Date;
    description: string;
  }> = [];

  // Application submitted
  timeline.push({
    step: 'Application Started',
    status: 'completed',
    date: application.applicationDate,
    description: 'Financing application initiated'
  });

  // Documents
  const allDocsSubmitted = application.documentsRequired.every(d => d.submitted);
  timeline.push({
    step: 'Documents Submitted',
    status: allDocsSubmitted ? 'completed' : (application.status === 'DOCUMENTS_PENDING' ? 'current' : 'pending'),
    date: application.documentsSubmittedAt,
    description: allDocsSubmitted
      ? 'All required documents received'
      : `${application.documentsSubmitted.length}/${application.documentsRequired.length} documents submitted`
  });

  // Under review
  timeline.push({
    step: 'Bank Review',
    status: application.status === 'UNDER_REVIEW'
      ? 'current'
      : (application.reviewStartedAt ? 'completed' : 'pending'),
    date: application.reviewStartedAt,
    description: application.status === 'UNDER_REVIEW'
      ? 'Application is being reviewed by the bank'
      : (application.reviewStartedAt ? 'Review completed' : 'Awaiting review')
  });

  // Decision
  timeline.push({
    step: 'Decision',
    status: ['APPROVED', 'REJECTED'].includes(application.status)
      ? 'completed'
      : (application.status === 'UNDER_REVIEW' ? 'pending' : 'pending'),
    date: application.decisionAt,
    description: application.status === 'APPROVED'
      ? `Approved for AED ${application.approvedAmount?.toLocaleString()}`
      : (application.status === 'REJECTED'
        ? `Rejected: ${application.rejectionReason}`
        : 'Awaiting bank decision')
  });

  return timeline;
}

// Format financing summary for display
export function formatFinancingSummary(calc: FinancingCalculation): string {
  return `
Vehicle Price: AED ${calc.vehiclePrice.toLocaleString()}
Down Payment: AED ${calc.downPayment.toLocaleString()} (${calc.downPaymentPercent}%)
Loan Amount: AED ${calc.loanAmount.toLocaleString()}
Monthly Payment: AED ${calc.monthlyPayment.toLocaleString()} for ${calc.termMonths} months
Interest Rate: ${calc.interestRate}% p.a.
Total Interest: AED ${calc.totalInterest.toLocaleString()}
Processing Fee: AED ${calc.processingFee.toLocaleString()}
  `.trim();
}
