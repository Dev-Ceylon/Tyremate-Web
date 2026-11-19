/**
 * SO policy violation codes used throughout the application.
 * These match the ViolationTypeCode column in the PolicyViolationTypeM table.
 */
export const POLICY_VIOLATION_CODES = {
  OVER_MAX_DISCOUNT: 'ovmx',
  SKIPPED_OLD_STOCK: 'fsfo'
} as const;

// Creates a union type of all possible policy violation codes: 'ovmx' | 'fsfo'
export type PolicyViolationCode = typeof POLICY_VIOLATION_CODES[keyof typeof POLICY_VIOLATION_CODES];

/**
 * Interface for policy violation metadata, including display name and a CSS class for styling.
 */
export interface PolicyViolationMetadata {
  name: string;
  colorClass: string; // CSS class name for styling the violation type
}

/**
 * Metadata for each policy violation code, including human-readable display names and associated color classes.
 */
export const POLICY_VIOLATION_METADATA: Record<PolicyViolationCode, PolicyViolationMetadata> = {
  [POLICY_VIOLATION_CODES.OVER_MAX_DISCOUNT]: { name: 'Exceeds Max Discount', colorClass: 'violation-over-max-discount' },
  [POLICY_VIOLATION_CODES.SKIPPED_OLD_STOCK]: { name: 'Newer DOT Sold While Older Stock Available', colorClass: 'violation-skipped-old-stock' }
};

export const getPolicyViolationCode = (key: keyof typeof POLICY_VIOLATION_CODES): PolicyViolationCode => {
  return POLICY_VIOLATION_CODES[key];
};

export const getPolicyViolationName = (code: PolicyViolationCode | string | undefined): string => {
  if (!code) return 'Unknown';
  return POLICY_VIOLATION_METADATA[code as PolicyViolationCode]?.name || 'Unknown';
};

export const getPolicyViolationColorClass = (code: PolicyViolationCode | string | undefined): string => {
  if (!code) return '';
  return POLICY_VIOLATION_METADATA[code as PolicyViolationCode]?.colorClass || '';
};