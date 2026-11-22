export const SO_CATEGORIES = {
  TYRE: "tyre",
  BATTERY: "battery",
} as const

export type SOCategory = (typeof SO_CATEGORIES)[keyof typeof SO_CATEGORIES]

export const SO_CATEGORY_LABELS: Record<SOCategory, string> = {
  [SO_CATEGORIES.TYRE]: "Tyres",
  [SO_CATEGORIES.BATTERY]: "Batteries",
}

export const SO_CATEGORY_LIST: { key: SOCategory; label: string }[] = [
  { key: SO_CATEGORIES.TYRE, label: SO_CATEGORY_LABELS[SO_CATEGORIES.TYRE] },
  { key: SO_CATEGORIES.BATTERY, label: SO_CATEGORY_LABELS[SO_CATEGORIES.BATTERY] },
]
