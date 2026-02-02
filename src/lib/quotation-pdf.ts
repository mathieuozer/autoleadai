/**
 * Quotation PDF Generation
 *
 * Generates PDF quotations for vehicle orders using a server-side PDF library.
 * This module provides the data structure and template logic;
 * actual PDF rendering should be done with a library like @react-pdf/renderer or pdfkit.
 */

export interface QuotationData {
  // Quotation details
  quotationNumber: string;
  issuedAt: Date;
  validUntil: Date;
  issuedBy: string;

  // Customer info
  customer: {
    name: string;
    email?: string;
    phone: string;
    address?: string;
  };

  // Vehicle info
  vehicle: {
    brand: string;
    model: string;
    variant: string;
    year: number;
    exteriorColor: string;
    interiorColor: string;
    vin?: string;
    specs?: VehicleSpec[];
  };

  // Pricing
  pricing: {
    vehiclePrice: number;
    campaignDiscount?: number;
    additionalDiscount?: number;
    accessories?: AccessoryItem[];
    fees?: FeeItem[];
    subtotal: number;
    vat?: number;
    totalAmount: number;
    currency: string;
  };

  // Additional info
  notes?: string;
  termsAndConditions?: string[];

  // Dealership info
  dealership: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logoUrl?: string;
  };
}

export interface VehicleSpec {
  label: string;
  value: string;
}

export interface AccessoryItem {
  name: string;
  price: number;
}

export interface FeeItem {
  name: string;
  amount: number;
}

export interface QuotationPdfOptions {
  includeTerms: boolean;
  includeSpecs: boolean;
  language: 'en' | 'ar';
  template: 'standard' | 'premium';
}

/**
 * Generate quotation number
 */
export function generateQuotationNumber(prefix: string = 'QT'): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}${month}-${random}`;
}

/**
 * Calculate quotation totals
 */
export function calculateQuotationTotals(params: {
  vehiclePrice: number;
  campaignDiscount?: number;
  additionalDiscount?: number;
  accessories?: AccessoryItem[];
  fees?: FeeItem[];
  vatRate?: number;
}): {
  subtotal: number;
  totalDiscount: number;
  accessoriesTotal: number;
  feesTotal: number;
  vat: number;
  totalAmount: number;
} {
  const {
    vehiclePrice,
    campaignDiscount = 0,
    additionalDiscount = 0,
    accessories = [],
    fees = [],
    vatRate = 0, // UAE has 5% VAT but vehicle sales may be exempt
  } = params;

  const totalDiscount = campaignDiscount + additionalDiscount;
  const discountedPrice = vehiclePrice - totalDiscount;
  const accessoriesTotal = accessories.reduce((sum, a) => sum + a.price, 0);
  const feesTotal = fees.reduce((sum, f) => sum + f.amount, 0);
  const subtotal = discountedPrice + accessoriesTotal + feesTotal;
  const vat = Math.round(subtotal * vatRate * 100) / 100;
  const totalAmount = subtotal + vat;

  return {
    subtotal,
    totalDiscount,
    accessoriesTotal,
    feesTotal,
    vat,
    totalAmount,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'AED'): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get default terms and conditions
 */
export function getDefaultTerms(): string[] {
  return [
    'This quotation is valid for the period specified above.',
    'Prices are subject to change without prior notice after the validity period.',
    'Vehicle availability is subject to confirmation at the time of order.',
    'Registration and insurance fees are not included unless explicitly stated.',
    'Delivery timeline is estimated and may vary based on availability.',
    'Payment terms: Booking deposit required to confirm order.',
    'All prices are in AED and inclusive of applicable taxes unless otherwise stated.',
  ];
}

/**
 * Generate PDF template data (for React-PDF or similar)
 */
export function generatePdfTemplateData(
  data: QuotationData,
  options: QuotationPdfOptions = {
    includeTerms: true,
    includeSpecs: true,
    language: 'en',
    template: 'standard',
  }
): {
  header: Record<string, string>;
  customer: Record<string, string>;
  vehicle: Record<string, unknown>;
  pricing: Record<string, unknown>;
  footer: Record<string, string>;
} {
  return {
    header: {
      quotationNumber: data.quotationNumber,
      issuedDate: formatDate(data.issuedAt),
      validUntil: formatDate(data.validUntil),
      dealershipName: data.dealership.name,
      dealershipAddress: data.dealership.address,
      dealershipPhone: data.dealership.phone,
      dealershipEmail: data.dealership.email,
    },
    customer: {
      name: data.customer.name,
      email: data.customer.email || '',
      phone: data.customer.phone,
      address: data.customer.address || '',
    },
    vehicle: {
      fullName: `${data.vehicle.year} ${data.vehicle.brand} ${data.vehicle.model} ${data.vehicle.variant}`,
      brand: data.vehicle.brand,
      model: data.vehicle.model,
      variant: data.vehicle.variant,
      year: data.vehicle.year.toString(),
      exteriorColor: data.vehicle.exteriorColor,
      interiorColor: data.vehicle.interiorColor,
      vin: data.vehicle.vin || 'TBD',
      specs: options.includeSpecs ? data.vehicle.specs : [],
    },
    pricing: {
      vehiclePrice: formatCurrency(data.pricing.vehiclePrice, data.pricing.currency),
      campaignDiscount: data.pricing.campaignDiscount
        ? formatCurrency(data.pricing.campaignDiscount, data.pricing.currency)
        : null,
      additionalDiscount: data.pricing.additionalDiscount
        ? formatCurrency(data.pricing.additionalDiscount, data.pricing.currency)
        : null,
      accessories: data.pricing.accessories?.map(a => ({
        name: a.name,
        price: formatCurrency(a.price, data.pricing.currency),
      })),
      fees: data.pricing.fees?.map(f => ({
        name: f.name,
        amount: formatCurrency(f.amount, data.pricing.currency),
      })),
      subtotal: formatCurrency(data.pricing.subtotal, data.pricing.currency),
      vat: data.pricing.vat
        ? formatCurrency(data.pricing.vat, data.pricing.currency)
        : null,
      totalAmount: formatCurrency(data.pricing.totalAmount, data.pricing.currency),
      currency: data.pricing.currency,
    },
    footer: {
      issuedBy: data.issuedBy,
      notes: data.notes || '',
      terms: options.includeTerms
        ? (data.termsAndConditions || getDefaultTerms()).join('\n')
        : '',
    },
  };
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Validate quotation data before PDF generation
 */
export function validateQuotationData(data: Partial<QuotationData>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.quotationNumber) {
    errors.push('Quotation number is required');
  }

  if (!data.customer?.name) {
    errors.push('Customer name is required');
  }

  if (!data.customer?.phone) {
    errors.push('Customer phone is required');
  }

  if (!data.vehicle?.brand || !data.vehicle?.model) {
    errors.push('Vehicle brand and model are required');
  }

  if (!data.pricing?.vehiclePrice || data.pricing.vehiclePrice <= 0) {
    errors.push('Valid vehicle price is required');
  }

  if (!data.pricing?.totalAmount || data.pricing.totalAmount <= 0) {
    errors.push('Total amount must be calculated');
  }

  if (!data.validUntil) {
    errors.push('Validity date is required');
  } else if (new Date(data.validUntil) <= new Date()) {
    errors.push('Validity date must be in the future');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get quotation status display info
 */
export function getQuotationStatusInfo(status: string): {
  label: string;
  color: string;
  description: string;
} {
  const statusInfo: Record<string, { label: string; color: string; description: string }> = {
    DRAFT: {
      label: 'Draft',
      color: 'gray',
      description: 'Quotation is being prepared',
    },
    ISSUED: {
      label: 'Issued',
      color: 'blue',
      description: 'Quotation has been issued and is awaiting customer response',
    },
    SENT: {
      label: 'Sent',
      color: 'purple',
      description: 'Quotation has been sent to the customer',
    },
    ACCEPTED: {
      label: 'Accepted',
      color: 'green',
      description: 'Customer has accepted the quotation',
    },
    EXPIRED: {
      label: 'Expired',
      color: 'orange',
      description: 'Quotation validity period has ended',
    },
    CANCELLED: {
      label: 'Cancelled',
      color: 'red',
      description: 'Quotation has been cancelled',
    },
  };

  return statusInfo[status] || {
    label: status,
    color: 'gray',
    description: 'Unknown status',
  };
}
