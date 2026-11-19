// SO policy violation constants for the application
// Centralizes violation type codes and names to avoid hardcoding throughout the codebase

const POLICY_VIOLATION_CODES = {
  OVER_MAX_DISCOUNT: "ovmx",
  SKIPPED_OLD_STOCK: "fsfo",
};

const POLICY_VIOLATION_NAMES = {
  [POLICY_VIOLATION_CODES.OVER_MAX_DISCOUNT]: "Exceeds Max Discount",
  [POLICY_VIOLATION_CODES.SKIPPED_OLD_STOCK]: "Newer DOT Sold While Older Stock Available",
};

const POLICY_VIOLATION_IDS = {
  // These will be populated at runtime from database
  OVER_MAX_DISCOUNT: null,
  SKIPPED_OLD_STOCK: null,
};

// Policy violation seed data - single source of truth for seeding
const POLICY_VIOLATION_SEED_DATA = [
  [
    POLICY_VIOLATION_CODES.OVER_MAX_DISCOUNT,
    POLICY_VIOLATION_NAMES[POLICY_VIOLATION_CODES.OVER_MAX_DISCOUNT],
  ],
  [
    POLICY_VIOLATION_CODES.SKIPPED_OLD_STOCK,
    POLICY_VIOLATION_NAMES[POLICY_VIOLATION_CODES.SKIPPED_OLD_STOCK],
  ],
];

const getPolicyViolationCode = (type) => POLICY_VIOLATION_CODES[type];

const getPolicyViolationName = (code) => POLICY_VIOLATION_NAMES[code];

const getPolicyViolationId = (typeKey) => POLICY_VIOLATION_IDS[typeKey];

const initializePolicyViolationIds = (db) => {
  Object.keys(POLICY_VIOLATION_CODES).forEach((key) => {
    const type = db
      .prepare("SELECT Id FROM PolicyViolationTypeM WHERE ViolationTypeCode = ?")
      .get(POLICY_VIOLATION_CODES[key]);

    if (type) {
      POLICY_VIOLATION_IDS[key] = type.Id;
    }
  });
};

module.exports = {
  POLICY_VIOLATION_CODES,
  POLICY_VIOLATION_NAMES,
  POLICY_VIOLATION_IDS,
  POLICY_VIOLATION_SEED_DATA,
  getPolicyViolationCode,
  getPolicyViolationName,
  getPolicyViolationId,
  initializePolicyViolationIds,
};