import { useCallback } from "react"
import { useNavigate, useParams } from "@/lib/router"
import { usePurchaseOrderStorageAllocation } from "../hooks/usePurchaseOrderStorageAllocation"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { LocationOptions } from "../components/LocationOptions"
import { saveButtonLabel } from "../../../shared/ui/saveButtonLabel"

export default function PurchaseOrderAllocateLocationPage() {
  const navigate = useNavigate()
  const { poId } = useParams()
  const { showToast } = useToast()

  const handleSuccess = useCallback(() => {
    showToast({
      variant: "success",
      title: "Success",
      message: "Inventory locations allocated successfully."
    })
    navigate(`/purchase-orders/${poId}`)
  }, [navigate, poId, showToast])

  const handleError = useCallback((message: string) => {
    showToast({
      variant: "error",
      title: "Error",
      message
    })
  }, [showToast])

  const { 
    order, 
    locations,
    localAllocations,
    loading, 
    submitting, 
    error, 
    actions 
  } = usePurchaseOrderStorageAllocation({ onSuccess: handleSuccess, onError: handleError })

  if (loading) return <main className="app-shell"><p className="hero-text">Loading allocation details...</p></main>
  if (error || !order) return <main className="app-shell"><p className="hero-text error-text">{error || "Order not found"}</p></main>

  const isBattery = order.Category === "battery"
  const lines = (isBattery ? order.Batteries : order.Tyres) || order.Lines || []

  const getReservedByLocation = (itemId: number): Record<number, number> => {
    const reservedByLocation: Record<number, number> = {}

    lines.forEach((other: any) => {
      if (other.ID === itemId) return
      const otherLocationId = localAllocations[other.ID]
      if (!otherLocationId) return
      reservedByLocation[otherLocationId] =
        (reservedByLocation[otherLocationId] ?? 0) + other.Qty
    })

    return reservedByLocation
  }

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Inventory Management</p>
          <h1>Allocate Locations: PO #{poId}</h1>
          <p className="hero-text">Assign specific storage locations for incoming {isBattery ? "batteries" : "tyres"} in this purchase order.</p>
        </div>
        <div className="header-actions">
          <button 
            className="primary-action" 
            onClick={() => void actions.submitAllocations()} 
            disabled={submitting}
          >
            {saveButtonLabel("allocations", submitting)}
          </button>
          <button className="secondary-action" onClick={() => navigate(`/purchase-orders/${poId}`)}>
            Cancel
          </button>
        </div>
      </section>

      <section className="table-panel panel panel-strong">
        <div className="table-panel-header">
          <h2>{isBattery ? "Battery Line Items" : "Tyre Line Items"}</h2>
        </div>
        <div className="tm-table-scroll">
          <table className="product-table">
            <thead>
              <tr>
                <th>{isBattery ? "Battery Details" : "Tyre Details"}</th>
                <th className="text-right">Ordered Qty</th>
                <th>Storage Location</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((item: any) => {
                const reservedByLocation = getReservedByLocation(item.ID)
                const label = isBattery
                  ? `${item.Brand} ${item.Model ? `- ${item.Model}` : ""} ${item.Capacity ? `(${item.Capacity}` : ""}${item.Voltage ? ` ${item.Voltage})` : item.Capacity ? ")" : ""}`
                  : `${item.Brand} / ${item.Size} / ${item.Pattern}`

                return (
                  <tr key={item.ID}>
                    <td>
                      <div className="font-medium">
                        {label}
                      </div>
                    </td>
                    <td className="text-right font-bold">{item.Qty}</td>
                    <td>
                      <select
                        className="text-input"
                        value={localAllocations[item.ID] || ""}
                        onChange={(e) => actions.updateAllocation(item.ID, Number(e.target.value))}
                      >
                        <LocationOptions
                          locations={locations}
                          tyreQty={item.Qty}
                          reservedByLocation={reservedByLocation}
                        />
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}