/**
 * Discount Approval Rules Engine
 *
 * Determines required approval levels based on discount amount and brand-specific rules.
 * Approval levels:
 * - Level 1: Branch Manager (BM) only
 * - Level 2: Branch Manager + General Manager (GM)
 */

export interface DiscountRule {
  maxAmount: number;      // Max discount in AED
  requiredLevel: number;  // 1 = BM only, 2 = BM + GM
}

export interface DiscountRulesConfig {
  brandRules?: Record<string, DiscountRule[]>;
  defaultRules: DiscountRule[];
}

// Default rules (can be overridden per brand)
export const DEFAULT_DISCOUNT_RULES: DiscountRule[] = [
  { maxAmount: 5000, requiredLevel: 1 },    // Up to 5K: BM only
  { maxAmount: 15000, requiredLevel: 2 },   // 5K-15K: BM + GM
  { maxAmount: Infinity, requiredLevel: 2 }, // Above 15K: BM + GM
];

// Brand-specific rules examples
export const BRAND_DISCOUNT_RULES: Record<string, DiscountRule[]> = {
  // Luxury brands may have stricter rules
  BMW: [
    { maxAmount: 3000, requiredLevel: 1 },
    { maxAmount: 10000, requiredLevel: 2 },
    { maxAmount: Infinity, requiredLevel: 2 },
  ],
  MERCEDES: [
    { maxAmount: 3000, requiredLevel: 1 },
    { maxAmount: 10000, requiredLevel: 2 },
    { maxAmount: Infinity, requiredLevel: 2 },
  ],
  // Volume brands may have more flexible rules
  TOYOTA: [
    { maxAmount: 7500, requiredLevel: 1 },
    { maxAmount: 20000, requiredLevel: 2 },
    { maxAmount: Infinity, requiredLevel: 2 },
  ],
  NISSAN: [
    { maxAmount: 7500, requiredLevel: 1 },
    { maxAmount: 20000, requiredLevel: 2 },
    { maxAmount: Infinity, requiredLevel: 2 },
  ],
};

/**
 * Get the required approval level for a discount amount
 */
export function getRequiredApprovalLevel(
  discountAmount: number,
  brandCode?: string
): number {
  const rules = brandCode && BRAND_DISCOUNT_RULES[brandCode.toUpperCase()]
    ? BRAND_DISCOUNT_RULES[brandCode.toUpperCase()]
    : DEFAULT_DISCOUNT_RULES;

  const rule = rules.find(r => discountAmount <= r.maxAmount);
  return rule?.requiredLevel || 2;
}

/**
 * Parse discount rules from JSON (from Brand model)
 */
export function parseDiscountRules(rulesJson: unknown): DiscountRule[] {
  if (!rulesJson || !Array.isArray(rulesJson)) {
    return DEFAULT_DISCOUNT_RULES;
  }

  try {
    return rulesJson.map((rule: Record<string, unknown>) => ({
      maxAmount: typeof rule.maxAmount === 'number' ? rule.maxAmount : Infinity,
      requiredLevel: typeof rule.requiredLevel === 'number' ? rule.requiredLevel : 2,
    }));
  } catch {
    return DEFAULT_DISCOUNT_RULES;
  }
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercentage(
  originalPrice: number,
  discountAmount: number
): number {
  if (originalPrice <= 0) return 0;
  return Math.round((discountAmount / originalPrice) * 10000) / 100; // 2 decimal places
}

/**
 * Validate discount request
 */
export interface DiscountValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateDiscountRequest(
  discountAmount: number,
  originalPrice: number,
  maxDiscountPercent: number = 25 // Default max 25% discount
): DiscountValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (discountAmount <= 0) {
    errors.push('Discount amount must be greater than 0');
  }

  if (discountAmount >= originalPrice) {
    errors.push('Discount cannot be greater than or equal to the original price');
  }

  const discountPercent = calculateDiscountPercentage(originalPrice, discountAmount);

  if (discountPercent > maxDiscountPercent) {
    errors.push(`Discount exceeds maximum allowed (${maxDiscountPercent}%)`);
  }

  if (discountPercent > 15) {
    warnings.push('Discount is above 15%, additional justification may be required');
  }

  if (discountPercent > 20) {
    warnings.push('High discount detected, GM approval will be required regardless of amount');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get approval level display name
 */
export function getApprovalLevelName(level: number): string {
  switch (level) {
    case 1:
      return 'Branch Manager';
    case 2:
      return 'Branch Manager + General Manager';
    default:
      return 'Unknown';
  }
}

/**
 * Get next approver role based on current level
 */
export function getNextApproverRole(currentLevel: number, requiredLevel: number): string | null {
  if (currentLevel >= requiredLevel) {
    return null; // Already fully approved
  }

  switch (currentLevel) {
    case 0:
      return 'BRANCH_MANAGER';
    case 1:
      return requiredLevel > 1 ? 'ADMIN' : null; // GM role is ADMIN in our system
    default:
      return null;
  }
}
