import type { StorageLocationRecord } from "../../master-data/storage-locations/models/storageLocation"

interface LocationOptionsProps {
  locations: StorageLocationRecord[]
  tyreQty: number
  reservedByLocation?: Record<number, number>
}

export function LocationOptions({ locations, tyreQty, reservedByLocation = {} }: LocationOptionsProps) {
  const options = locations
    .map((loc) => {
      const reserved = reservedByLocation[loc.Id] ?? 0
      const total = loc.Capacity ?? 0
      const free = Math.max((loc.RemainingCapacity ?? 0) - reserved, 0)
      return { loc, free, total, fits: free >= tyreQty }
    })
    .sort((a, b) => b.free - a.free)

  return (
    <>
      <option value="">Select location...</option>
      {options.map(({ loc, free, total, fits }) => (
        <option key={loc.Id} value={loc.Id} disabled={!fits}>
          {loc.LocationCode} - {loc.LocationName} (Free: {free}/{total}
          {fits ? ` \u00b7 Fits ${tyreQty}` : " \u00b7 Insufficient"})
        </option>
      ))}
    </>
  )
}