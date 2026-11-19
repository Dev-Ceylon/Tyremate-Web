/**
 * Single source of truth for how a tyre is described in the UI.
 *
 * Tyre labels were previously hand-built in each screen and had drifted apart:
 * some showed Brand, some did not, some appended the tyre id. Every display now
 * derives from the field list below, so adding or reordering a descriptor is a
 * one-line change instead of a sweep across every feature.
 */

export type TyreDisplayFieldKey =
  | "Brand"
  | "Size"
  | "Pattern"
  | "LL_SR"
  | "PR"
  | "SideWall"
  | "DOT"

/** Anything that can describe a tyre: a master record or a joined association. */
export type TyreDisplaySource = Partial<Record<TyreDisplayFieldKey, string | null | undefined>> & {
  Id?: number | null
  TyreID?: number | null
}

export type TyreLabelPreset = "compact" | "full"

type TyreDisplayField = {
  key: TyreDisplayFieldKey
  separator: string
}

const FIELD_SEPARATOR = " / "
const PLACEHOLDER = "NA"

/** Brand leads because it is the field most often missing from a tyre's spec. */
const TYRE_DISPLAY_FIELDS: Record<TyreLabelPreset, TyreDisplayField[]> = {
  compact: [
    { key: "Brand", separator: FIELD_SEPARATOR },
    { key: "Size", separator: " - " },
    { key: "Pattern", separator: FIELD_SEPARATOR },
  ],
  full: [
    { key: "Brand", separator: FIELD_SEPARATOR },
    { key: "Size", separator: " - " },
    { key: "Pattern", separator: FIELD_SEPARATOR },
    { key: "LL_SR", separator: FIELD_SEPARATOR },
    { key: "PR", separator: FIELD_SEPARATOR },
    { key: "SideWall", separator: FIELD_SEPARATOR },
    { key: "DOT", separator: FIELD_SEPARATOR },
  ],
}

export const getTyreId = (tyre: TyreDisplaySource): number | null => tyre.TyreID ?? tyre.Id ?? null

/**
 * Joins the preset's fields, skipping blanks so a tyre missing an optional
 * value does not render a dangling separator. Falls back to a placeholder when
 * a tyre has no descriptive data at all.
 */
export const formatTyreDescriptor = (
  tyre: TyreDisplaySource,
  preset: TyreLabelPreset = "compact",
): string => {
  const fields = TYRE_DISPLAY_FIELDS[preset]

  let descriptor = ""
  let pendingSeparator = ""

  for (const field of fields) {
    const value = tyre[field.key]?.trim()
    if (!value) continue

    descriptor += pendingSeparator + value
    pendingSeparator = field.separator
  }

  return descriptor || PLACEHOLDER
}

/**
 * Full label for lists and pickers. `showId` prefixes the tyre id, which is
 * useful when several tyres share a descriptor.
 */
export const formatTyreLabel = (
  tyre: TyreDisplaySource,
  options: { preset?: TyreLabelPreset; showId?: boolean } = {},
): string => {
  const { preset = "compact", showId = false } = options
  const descriptor = formatTyreDescriptor(tyre, preset)

  if (!showId) return descriptor

  const tyreId = getTyreId(tyre)
  return tyreId === null ? descriptor : `${tyreId} - ${descriptor}`
}