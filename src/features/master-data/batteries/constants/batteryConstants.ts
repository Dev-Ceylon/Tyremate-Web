export const BATTERY_APPLICATIONS = {
  MOTORCYCLE: "Motorcycle",
  AUTOMOTIVE: "Automotive",
  THREE_WHEELER: "Three-Wheeler",
  COMMERCIAL_VEHICLE: "Commercial Vehicle",
  AGRICULTURAL: "Agricultural / Tractor",
  DEEP_CYCLE_SOLAR: "Deep Cycle / Solar",
  INDUSTRIAL_UPS: "Industrial / UPS",
  MARINE: "Marine",
  OTHER: "Other",
} as const

export type BatteryApplication =
  typeof BATTERY_APPLICATIONS[keyof typeof BATTERY_APPLICATIONS]

export const BATTERY_APPLICATION_OPTIONS: ReadonlyArray<{
  value: BatteryApplication
  label: string
}> = [
  { value: BATTERY_APPLICATIONS.MOTORCYCLE, label: "Motorcycle" },
  { value: BATTERY_APPLICATIONS.AUTOMOTIVE, label: "Automotive" },
  { value: BATTERY_APPLICATIONS.THREE_WHEELER, label: "Three-Wheeler" },
  { value: BATTERY_APPLICATIONS.COMMERCIAL_VEHICLE, label: "Commercial Vehicle" },
  { value: BATTERY_APPLICATIONS.AGRICULTURAL, label: "Agricultural / Tractor" },
  { value: BATTERY_APPLICATIONS.DEEP_CYCLE_SOLAR, label: "Deep Cycle / Solar" },
  { value: BATTERY_APPLICATIONS.INDUSTRIAL_UPS, label: "Industrial / UPS" },
  { value: BATTERY_APPLICATIONS.MARINE, label: "Marine" },
  { value: BATTERY_APPLICATIONS.OTHER, label: "Other" },
]
