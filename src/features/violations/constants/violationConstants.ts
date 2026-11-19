// Violation Type Constants - Frontend mirror of backend policyViolationConstants
// Centralizes violation type codes and names to avoid hardcoding throughout the codebase

export const VIOLATION_TYPE_CODES = {
  OVER_MAX_DISCOUNT: "ovmx",
  SKIPPED_OLD_STOCK: "fsfo",
} as const;

export type ViolationTypeCode = typeof VIOLATION_TYPE_CODES[keyof typeof VIOLATION_TYPE_CODES];

export const VIOLATION_TYPE_NAMES = {
  [VIOLATION_TYPE_CODES.OVER_MAX_DISCOUNT]: "Exceeds Max Discount",
  [VIOLATION_TYPE_CODES.SKIPPED_OLD_STOCK]: "Newer DOT Sold While Older Stock Available",
} as const;

export const VIOLATION_TYPE_LABELS = {
  [VIOLATION_TYPE_CODES.OVER_MAX_DISCOUNT]: "Discount",
  [VIOLATION_TYPE_CODES.SKIPPED_OLD_STOCK]: "FSFO",
} as const;

// Violation Status
export const VIOLATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type ViolationStatus = typeof VIOLATION_STATUS[keyof typeof VIOLATION_STATUS];

// Violation Severity (for UI styling)
export const VIOLATION_SEVERITY = {
  [VIOLATION_TYPE_CODES.OVER_MAX_DISCOUNT]: "warning",
  [VIOLATION_TYPE_CODES.SKIPPED_OLD_STOCK]: "error",
} as const;

export type ViolationSeverity = typeof VIOLATION_SEVERITY[keyof typeof VIOLATION_SEVERITY];

// Violation Status badge tone
export function getStatusBadgeTone(status: number | string): "approved" | "rejected" | "pending" | "arrived" | "completed" {
  const s = String(status);
  if (s === "1" || s === "approved") return "approved";
  if (s === "-1" || s === "rejected") return "rejected";
  return "pending";
}

// Helper functions
export const getViolationTypeName = (code: string): string => {
  const entry = Object.entries(VIOLATION_TYPE_CODES).find(([, value]) => value === code);
  return entry ? VIOLATION_TYPE_NAMES[entry[0] as keyof typeof VIOLATION_TYPE_NAMES] : code;
};

export const getViolationSeverity = (code: string): "warning" | "error" | "info" => {
  if (code === "ovmx") return "warning";
  if (code === "fsfo") return "error";
  return "info";
};

export const getViolationShortLabel = (code: string): string => {
  if (code === "ovmx") return "Discount";
  if (code === "fsfo") return "FSFO";
  return code;
};

export function isPending(status: string): boolean {
  return status === "pending";
}

export function isApproved(status: string): boolean {
  return status === "approved";
}

export function isRejected(status: string): boolean {
  return status === "rejected";
}