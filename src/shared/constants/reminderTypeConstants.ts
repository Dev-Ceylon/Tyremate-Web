/**
 * Reminder type codes used throughout the application.
 * These match the ReminderTypeCode column in the ReminderTypes table.
 */
export const REMINDER_TYPE_CODES = {
  INQUIRY_FOLLOW_UP: 'ifup',
  INQUIRY_CALL: 'ical',
  INQUIRY_VISIT: 'ivst',
  CHEQUE_FOLLOW_UP: 'chfq',
  SO_FOLLOW_UP: 'sofu',
  TYRE_EXPIRY: 'tyex',
} as const;

export type ReminderTypeCode = typeof REMINDER_TYPE_CODES[keyof typeof REMINDER_TYPE_CODES];

export const REMINDER_TYPE_LIST = Object.values(REMINDER_TYPE_CODES) as ReminderTypeCode[];

export interface ReminderTypeMetadata {
  name: string;
}

export const REMINDER_TYPE_METADATA: Record<ReminderTypeCode, ReminderTypeMetadata> = {
  [REMINDER_TYPE_CODES.INQUIRY_FOLLOW_UP]: { name: 'Inquiry Follow-up' },
  [REMINDER_TYPE_CODES.INQUIRY_CALL]: { name: 'Inquiry Call' },
  [REMINDER_TYPE_CODES.INQUIRY_VISIT]: { name: 'Inquiry Visit' },
  [REMINDER_TYPE_CODES.CHEQUE_FOLLOW_UP]: { name: 'Cheque Follow-up' },
  [REMINDER_TYPE_CODES.SO_FOLLOW_UP]: { name: 'SO Follow-up' },
  [REMINDER_TYPE_CODES.TYRE_EXPIRY]: { name: 'Tyre Expiry' },
};

export const getReminderTypeCode = (key: keyof typeof REMINDER_TYPE_CODES): ReminderTypeCode => {
  return REMINDER_TYPE_CODES[key];
};

export const getReminderTypeName = (code: ReminderTypeCode | string | undefined): string => {
  if (!code) return 'Unknown';
  return REMINDER_TYPE_METADATA[code as ReminderTypeCode]?.name || 'Unknown';
};
