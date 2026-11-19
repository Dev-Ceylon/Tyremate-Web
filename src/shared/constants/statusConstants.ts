/**
 * Status codes used throughout the application.
 * These match the StatusCode column in the StatusM table.
 */
export const STATUS_CODES = {
  PENDING: 'pdn',
  SENT: 'snt',
  COMPLETED: 'cmp',
  GP_ISSUED: 'gpi',
  SENT_OUT: 'sno',
  ARRIVED: 'arv',
  ARRIVING: 'arr',
  DRAFT: 'dft'
} as const;

// This creates a union type of all possible status codes: 'pdn' | 'snt' | 'cmp' | 'gpi' | 'sno' | 'arv' | 'arr'
export type StatusCode = typeof STATUS_CODES[keyof typeof STATUS_CODES];

/**
 * Interface for status metadata, including display name and a CSS class for styling.
 */
export interface StatusMetadata {
  name: string;
  colorClass: string; // CSS class name for styling the status
}

/**
 * Metadata for each status code, including human-readable display names and associated color classes.
 */
export const STATUS_METADATA: Record<StatusCode, StatusMetadata> = {
  [STATUS_CODES.PENDING]: { name: 'Pending', colorClass: 'status-pending' },
  [STATUS_CODES.SENT]: { name: 'Sent', colorClass: 'status-sent' },
  [STATUS_CODES.COMPLETED]: { name: 'Completed', colorClass: 'status-completed' },
  [STATUS_CODES.GP_ISSUED]: { name: 'Gate Pass Issued', colorClass: 'status-gp-issued' },
  [STATUS_CODES.SENT_OUT]: { name: 'Sent Out', colorClass: 'status-sent-out' },
  [STATUS_CODES.ARRIVED]: { name: 'Arrived', colorClass: 'status-arrived' },
  [STATUS_CODES.ARRIVING]: { name: 'Arriving', colorClass: 'status-arriving' },
  [STATUS_CODES.DRAFT]: { name: 'Draft', colorClass: 'status-draft' }
};

export const getStatusCode = (key: keyof typeof STATUS_CODES): StatusCode => {
  return STATUS_CODES[key];
};

export const getStatusName = (code: StatusCode | string | undefined): string => {
  if (!code) return 'Unknown';
  return STATUS_METADATA[code as StatusCode]?.name || 'Unknown';
};

export const getStatusColorClass = (code: StatusCode | string | undefined): string => {
  if (!code) return '';
  return STATUS_METADATA[code as StatusCode]?.colorClass || '';
};