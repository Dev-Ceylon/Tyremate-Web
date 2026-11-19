import { useNavigate } from "@/lib/router"
import type { KeyboardEvent } from "react"
import type { ConsumableLocationRecord } from "../../../shared/models/consumables/consumableLocation"
import { CircularProgress } from "../../../shared/ui/progress/CircularProgress"

type ConsumableLocationCardsProps = {
  locations: ConsumableLocationRecord[]
  selectedBranchName?: string | null
  loading?: boolean
}

export function ConsumableLocationCards({
  locations,
  selectedBranchName,
  loading = false,
}: ConsumableLocationCardsProps) {
  const navigate = useNavigate()

  const handleLocationOpen = (locationId: number, branchId: number | null) => {
    if (branchId === null) {
      return
    }

    navigate(`/storage-manager/consumables/locations/${locationId}/branches/${branchId}`)
  }

  const handleLocationKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    locationId: number,
    branchId: number | null,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    handleLocationOpen(locationId, branchId)
  }

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Consumable Locations</p>
          <h2>Available locations</h2>
        </div>
      </div>

      {loading ? <p className="hero-text">Loading consumable locations...</p> : null}

      {!loading && locations.length === 0 ? (
        <p className="table-empty">No consumable locations available for the selected branch.</p>
      ) : null}

      {locations.length > 0 ? (
        <div className="storage-location-grid">
          {locations.map((location) => {
            const capacity = location.Capacity ?? 0
            const used = location.UsedCapacity ?? 0
            const usagePercent = capacity > 0 ? Math.min((used / capacity) * 100, 100) : 0
            const branchId = location.BranchId

            return (
              <article
                key={location.Id}
                className="info-panel panel panel-strong storage-location-card"
                onClick={() => handleLocationOpen(location.Id, branchId)}
                onKeyDown={(event) => handleLocationKeyDown(event, location.Id, branchId)}
                role="button"
                tabIndex={branchId === null ? -1 : 0}
              >
                <div className="storage-location-card-content">
                  <p className="section-label">
                    {location.LocationCode || `Location ${location.Id}`}
                  </p>
                  <h2>{location.LocationName || "Unnamed consumable location"}</h2>
                  <p>
                    Branch: {location.Branch || selectedBranchName || "Unassigned"}
                  </p>
                  <p>
                    Capacity: {capacity}
                  </p>
                  <p>
                    Used: {used}
                  </p>
                  <p>
                    Remaining: {location.RemainingCapacity ?? 0}
                  </p>
                </div>

                <div className="storage-location-card-progress">
                  <CircularProgress
                    value={usagePercent}
                    text="Used"
                    ariaLabel={`Usage ${Math.round(usagePercent)} percent`}
                  />
                </div>
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
