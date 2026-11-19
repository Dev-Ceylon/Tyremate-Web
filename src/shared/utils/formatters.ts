/**
 * Currency and financial value formatting utilities for TyreMate.
 */

/**
 * Format numeric values into Sri Lankan Rupees (LKR) with standard commas and decimals.
 * e.g. formatLKR(1250000.5) => "Rs. 1,250,000.50"
 */
export const formatLKR = (amount: number, decimals: number = 2): string => {
  return `Rs. ${(amount || 0).toLocaleString("en-LK", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

export const formatMoney = (amount: number): string => {
  return `LKR ${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const formatMoneyCompact = (amount: number): string => {
  return `LKR ${(amount || 0).toLocaleString()}`
}

const MONTH_SHORT_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const

/**
 * Format chart time-series period buckets (day, week, month, year) for x-axis display.
 * e.g.:
 * - month: "2026-05" => "May '26"
 * - week: "2026-W18" => "2026 Wk 18"
 * - day: "2026-05-12" => "5/12"
 */
export const formatChartPeriod = (
  period: string,
  interval?: "day" | "week" | "month" | "year" | string
): string => {
  if (!period) return ""

  if (interval === "month") {
    const [year, month] = period.split("-")
    const monthIndex = Number(month) - 1
    if (monthIndex >= 0 && monthIndex < 12 && year) {
      return `${MONTH_SHORT_NAMES[monthIndex]} '${year.slice(2)}`
    }
  }

  if (interval === "week") {
    return period.replace("-W", " Wk ")
  }

  // Daily: MM/DD
  const parts = period.split("-")
  if (parts.length === 3) {
    return `${Number(parts[1])}/${Number(parts[2])}`
  }

  return period
}
