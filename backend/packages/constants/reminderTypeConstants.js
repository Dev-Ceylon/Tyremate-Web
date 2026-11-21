// Reminder type constants for the application
// Centralizes reminder type codes and names to avoid hardcoding throughout the codebase

const REMINDER_TYPE_CODES = {
  INQUIRY_FOLLOW_UP: "ifup",
  INQUIRY_CALL: "ical",
  INQUIRY_VISIT: "ivst",
  CHEQUE_FOLLOW_UP: "chfq",
  SO_FOLLOW_UP: "sofu",
  TYRE_EXPIRY: "tyex",
  BATTERY_EXPIRY: "baex",
  BATTERY_RECHARGE: "barc",
  BATTERY_WARRANTY: "bawn",
};

const REMINDER_TYPE_NAMES = {
  [REMINDER_TYPE_CODES.INQUIRY_FOLLOW_UP]: "Inquiry Follow-up",
  [REMINDER_TYPE_CODES.INQUIRY_CALL]: "Inquiry Call",
  [REMINDER_TYPE_CODES.INQUIRY_VISIT]: "Inquiry Visit",
  [REMINDER_TYPE_CODES.CHEQUE_FOLLOW_UP]: "Cheque Follow-up",
  [REMINDER_TYPE_CODES.SO_FOLLOW_UP]: "SO Follow-up",
  [REMINDER_TYPE_CODES.TYRE_EXPIRY]: "Tyre Expiry",
  [REMINDER_TYPE_CODES.BATTERY_EXPIRY]: "Battery Expiry",
  [REMINDER_TYPE_CODES.BATTERY_RECHARGE]: "Battery Recharge",
  [REMINDER_TYPE_CODES.BATTERY_WARRANTY]: "Battery Warranty",
};

const REMINDER_TYPE_IDS = {
  // These will be populated at runtime from database
  INQUIRY_FOLLOW_UP: null,
  INQUIRY_CALL: null,
  INQUIRY_VISIT: null,
  CHEQUE_FOLLOW_UP: null,
  SO_FOLLOW_UP: null,
  TYRE_EXPIRY: null,
  BATTERY_EXPIRY: null,
  BATTERY_RECHARGE: null,
  BATTERY_WARRANTY: null,
};

// Reminder type seed data - single source of truth for seeding
const REMINDER_TYPE_SEED_DATA = [
  [
    REMINDER_TYPE_CODES.INQUIRY_FOLLOW_UP,
    REMINDER_TYPE_NAMES[REMINDER_TYPE_CODES.INQUIRY_FOLLOW_UP],
  ],
  [
    REMINDER_TYPE_CODES.INQUIRY_CALL,
    REMINDER_TYPE_NAMES[REMINDER_TYPE_CODES.INQUIRY_CALL],
  ],
  [
    REMINDER_TYPE_CODES.INQUIRY_VISIT,
    REMINDER_TYPE_NAMES[REMINDER_TYPE_CODES.INQUIRY_VISIT],
  ],
  [
    REMINDER_TYPE_CODES.CHEQUE_FOLLOW_UP,
    REMINDER_TYPE_NAMES[REMINDER_TYPE_CODES.CHEQUE_FOLLOW_UP],
  ],
  [
    REMINDER_TYPE_CODES.SO_FOLLOW_UP,
    REMINDER_TYPE_NAMES[REMINDER_TYPE_CODES.SO_FOLLOW_UP],
  ],
  [
    REMINDER_TYPE_CODES.TYRE_EXPIRY,
    REMINDER_TYPE_NAMES[REMINDER_TYPE_CODES.TYRE_EXPIRY],
  ],
  [
    REMINDER_TYPE_CODES.BATTERY_EXPIRY,
    REMINDER_TYPE_NAMES[REMINDER_TYPE_CODES.BATTERY_EXPIRY],
  ],
  [
    REMINDER_TYPE_CODES.BATTERY_RECHARGE,
    REMINDER_TYPE_NAMES[REMINDER_TYPE_CODES.BATTERY_RECHARGE],
  ],
  [
    REMINDER_TYPE_CODES.BATTERY_WARRANTY,
    REMINDER_TYPE_NAMES[REMINDER_TYPE_CODES.BATTERY_WARRANTY],
  ],
];

const getReminderTypeCode = (type) => REMINDER_TYPE_CODES[type];

const getReminderTypeName = (code) => REMINDER_TYPE_NAMES[code];

const getReminderTypeId = (typeKey) => REMINDER_TYPE_IDS[typeKey];

const initializeReminderTypeIds = (db) => {
  Object.keys(REMINDER_TYPE_CODES).forEach((key) => {
    const type = db
      .prepare(
        "SELECT Id FROM ReminderTypes WHERE ReminderTypeCode = ?"
      )
      .get(REMINDER_TYPE_CODES[key]);

    if (type) {
      REMINDER_TYPE_IDS[key] = type.Id;
    }
  });
};

module.exports = {
  REMINDER_TYPE_CODES,
  REMINDER_TYPE_NAMES,
  REMINDER_TYPE_IDS,
  REMINDER_TYPE_SEED_DATA,
  getReminderTypeCode,
  getReminderTypeName,
  getReminderTypeId,
  initializeReminderTypeIds,
};