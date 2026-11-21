/**
 * Supplier type constants used throughout the application.
 * These match the TypeCode column in the SupplierTypeM table.
 * Mirrors the StatusM / statusConstants pattern.
 */
export const SUPPLIER_TYPE_CODES = {
  TYRES: 'tyr',
  BATTERIES: 'bat',
  CONSUMABLES: 'cns',
  GENERAL: 'gen',
} as const

// Union type of all possible supplier type codes: 'tyr' | 'bat' | 'cns' | 'gen'
export type SupplierTypeCode = typeof SUPPLIER_TYPE_CODES[keyof typeof SUPPLIER_TYPE_CODES]

/**
 * Interface for supplier type metadata, including display name and CSS styling classes.
 */
export interface SupplierTypeMetadata {
  name: string
  colorClass: string
  badgeClass: string
  description?: string
}

/**
 * Metadata for each supplier type code.
 */
export const SUPPLIER_TYPE_METADATA: Record<SupplierTypeCode, SupplierTypeMetadata> = {
  [SUPPLIER_TYPE_CODES.TYRES]: {
    name: 'Tyres',
    colorClass: 'type-tyres',
    badgeClass: 'type-badge-tyres',
    description: 'Tyres, tubes, and wheel assemblies',
  },
  [SUPPLIER_TYPE_CODES.BATTERIES]: {
    name: 'Batteries',
    colorClass: 'type-batteries',
    badgeClass: 'type-badge-batteries',
    description: 'Automotive and motorcycle batteries',
  },
  [SUPPLIER_TYPE_CODES.CONSUMABLES]: {
    name: 'Consumables',
    colorClass: 'type-consumables',
    badgeClass: 'type-badge-consumables',
    description: 'Consumables and workshop supplies',
  },
  [SUPPLIER_TYPE_CODES.GENERAL]: {
    name: 'General',
    colorClass: 'type-general',
    badgeClass: 'type-badge-general',
    description: 'General suppliers and service vendors',
  },
}

/**
 * Select options for forms and filters.
 */
export const SUPPLIER_TYPE_OPTIONS: Array<{ value: SupplierTypeCode; label: string }> = [
  { value: SUPPLIER_TYPE_CODES.TYRES, label: 'Tyres' },
  { value: SUPPLIER_TYPE_CODES.BATTERIES, label: 'Batteries' },
  { value: SUPPLIER_TYPE_CODES.CONSUMABLES, label: 'Consumables' },
  { value: SUPPLIER_TYPE_CODES.GENERAL, label: 'General' },
]

export const getSupplierTypeCode = (key: keyof typeof SUPPLIER_TYPE_CODES): SupplierTypeCode => {
  return SUPPLIER_TYPE_CODES[key]
}

export const getSupplierTypeName = (code: SupplierTypeCode | string | null | undefined): string => {
  if (!code) return 'Unknown'
  const normalized = String(code).trim().toLowerCase()
  const match = Object.values(SUPPLIER_TYPE_CODES).find((c) => c === normalized)
  if (match) {
    return SUPPLIER_TYPE_METADATA[match]?.name || match
  }
  return String(code)
}

export const getSupplierTypeColorClass = (code: SupplierTypeCode | string | null | undefined): string => {
  if (!code) return ''
  const normalized = String(code).trim().toLowerCase()
  const match = Object.values(SUPPLIER_TYPE_CODES).find((c) => c === normalized)
  return match ? SUPPLIER_TYPE_METADATA[match]?.colorClass || '' : ''
}

export const getSupplierTypeBadgeClass = (code: SupplierTypeCode | string | null | undefined): string => {
  if (!code) return 'status-badge'
  const normalized = String(code).trim().toLowerCase()
  const match = Object.values(SUPPLIER_TYPE_CODES).find((c) => c === normalized)
  return match
    ? `status-badge ${SUPPLIER_TYPE_METADATA[match]?.badgeClass || ''}`
    : 'status-badge'
}
