/**
 * Single source of truth for polymorphic order item labels (Tyres and Batteries).
 * Derives consistent brand, specification, and descriptor labels without inline
 * string templates across components.
 */

export type OrderItemDisplaySource = {
  Brand?: string | null
  Size?: string | null
  Pattern?: string | null
  Model?: string | null
  Capacity?: string | null
  Voltage?: string | null
  Technology?: string | null
  Category?: string | null
  BatteryID?: number | null
  TyreID?: number | null
}

/**
 * Formats a tyre or battery item label for display across Purchase Orders,
 * Goods Receipts, and Stock Allocation.
 */
export function formatOrderItemLabel(
  item: OrderItemDisplaySource | null | undefined,
  category?: string | null
): string {
  if (!item) return ""

  const isBattery =
    category === "battery" ||
    item.Category === "battery" ||
    Boolean(item.BatteryID)

  if (isBattery) {
    const brand = item.Brand?.trim() || ""
    const model = item.Model ? `- ${item.Model.trim()}` : ""
    const specs = [item.Capacity?.trim(), item.Voltage?.trim()].filter(Boolean).join(" ")
    const specStr = specs ? `(${specs})` : ""

    const parts = [brand, model, specStr].filter(Boolean)
    return parts.join(" ").trim() || "Battery"
  }

  return [item.Brand?.trim(), item.Size?.trim(), item.Pattern?.trim()]
    .filter(Boolean)
    .join(" / ")
}
