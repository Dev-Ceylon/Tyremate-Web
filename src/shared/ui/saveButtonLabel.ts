export const SUBMITTING_LABEL = "Saving..."

export const SAVE_LABELS = {
  purchaseOrder: "Save Purchase Order",
  batches: "Save Batches",
  allocations: "Save Allocations",
} as const

export type SaveAction = keyof typeof SAVE_LABELS

export function saveButtonLabel(action: SaveAction, isSubmitting: boolean) {
  return isSubmitting ? SUBMITTING_LABEL : SAVE_LABELS[action]
}