import type { SoDeliveryProgress } from "../../models/delivery"
import { StatusBadge } from "../../../../shared/ui/StatusBadge"

type DeliveryStatusBadgeProps = {
  progress?: SoDeliveryProgress | null
}

/**
 * Summarises the collection state of a sales order as a single badge:
 * not delivered, partially delivered or fully delivered.
 */
export function DeliveryStatusBadge({ progress }: DeliveryStatusBadgeProps) {
  if (!progress) return null

  if (progress.IsFullyDelivered) {
    return <StatusBadge label="Delivered" tone="completed" />
  }
  if (progress.Totals.DeliveredQty > 0 && progress.Totals.RemainingCollectable > 0) {
    return <StatusBadge label="Partially Delivered (Ready to Collect)" tone="arrived" />
  }
  if (progress.Totals.DeliveredQty > 0) {
    return <StatusBadge label="Partially Delivered" tone="arrived" />
  }
  if (progress.Totals.RemainingCollectable > 0) {
    return <StatusBadge label="Ready to Collect" tone="arrived" />
  }
  return <StatusBadge label="Not Delivered" tone="pending" />
}
