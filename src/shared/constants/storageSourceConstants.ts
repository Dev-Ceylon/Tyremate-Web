/**
 * Storage source codes used to label where a stock lot came from. Mirrors
 * packages/constants/storageSourceConstants.js; the backend joins StorageSourceM
 * so the code (not the database Id) reaches the renderer.
 */
export const STORAGE_SOURCE_CODES = {
  DAG: 'dag',
  PO: 'po',
  MANUAL: 'manual'
} as const;

export type StorageSourceCode = typeof STORAGE_SOURCE_CODES[keyof typeof STORAGE_SOURCE_CODES];

export const STORAGE_SOURCE_NAMES: Record<StorageSourceCode, string> = {
  [STORAGE_SOURCE_CODES.DAG]: 'DAG',
  [STORAGE_SOURCE_CODES.PO]: 'PO',
  [STORAGE_SOURCE_CODES.MANUAL]: 'Manual'
};

export const getStorageSourceName = (code?: string | null): string => {
  if (!code) return '—';
  return STORAGE_SOURCE_NAMES[code as StorageSourceCode] ?? code;
};
