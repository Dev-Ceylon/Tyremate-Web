/**
 * Single source of truth for how a battery is described in the UI.
 * Mirrors the tyreDisplay pattern for consistent master data representation.
 */

export type BatteryDisplaySource = {
  Id?: number | null
  BatteryID?: number | null
  Brand?: string | null
  Model?: string | null
  Capacity?: string | null
  Voltage?: string | null
  Technology?: string | null
  Application?: string | null
  WarrantyMonths?: number | null
}

export type BatteryLabelOptions = {
  preset?: "compact" | "full"
  showId?: boolean
}

export function formatBatteryLabel(
  battery: BatteryDisplaySource,
  options: BatteryLabelOptions = {},
): string {
  const { preset = "full", showId = false } = options

  const id = battery.Id ?? battery.BatteryID
  const brand = battery.Brand?.trim()
  const model = battery.Model?.trim()
  const capacity = battery.Capacity?.trim()
  const voltage = battery.Voltage?.trim() || "12V"
  const technology = battery.Technology?.trim()
  const application = battery.Application?.trim()

  const mainParts: string[] = []
  if (brand) mainParts.push(brand)
  if (model) mainParts.push(model)

  const specParts: string[] = []
  if (capacity) specParts.push(capacity)
  if (voltage && (!capacity || !capacity.includes(voltage))) specParts.push(voltage)

  if (preset === "full") {
    if (technology) specParts.push(technology)
    if (application) specParts.push(application)
  }

  let label = mainParts.join(" ") || "Battery"
  if (specParts.length > 0) {
    label += ` (${specParts.join(" / ")})`
  }

  if (showId && id != null) {
    label = `[#${id}] ${label}`
  }

  return label
}
