export const PO_CATEGORIES = {
  TYRE: "tyre",
  BATTERY: "battery",
} as const

export type POCategory = (typeof PO_CATEGORIES)[keyof typeof PO_CATEGORIES]

export const PO_CATEGORY_LABELS: Record<POCategory, string> = {
  [PO_CATEGORIES.TYRE]: "Tyres",
  [PO_CATEGORIES.BATTERY]: "Batteries",
}

export const PO_CATEGORY_LIST: { key: POCategory; label: string }[] = [
  { key: PO_CATEGORIES.TYRE, label: PO_CATEGORY_LABELS[PO_CATEGORIES.TYRE] },
  { key: PO_CATEGORIES.BATTERY, label: PO_CATEGORY_LABELS[PO_CATEGORIES.BATTERY] },
]
