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

  const getReservedByLocation = (tyreId: number): Record<number, number> => {
    const reservedByLocation: Record<number, number> = {}

    ;(order.Tyres || []).forEach((other) => {
      if (other.ID === tyreId) return
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
          <p className="hero-text">Assign specific storage locations for incoming tyres in this purchase order.</p>
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
          <h2>Tyre Line Items</h2>
        </div>
        <div className="tm-table-scroll">
          <table className="product-table">
            <thead>
              <tr>
                <th>Tyre Details</th>
                <th className="text-right">Ordered Qty</th>
                <th>Storage Location</th>
              </tr>
            </thead>
            <tbody>
              {order.Tyres?.map((tyre) => {
                const reservedByLocation = getReservedByLocation(tyre.ID)

                return (
                  <tr key={tyre.ID}>
                    <td>
                      <div className="font-medium">
                        {tyre.Brand} / {tyre.Size} / {tyre.Pattern}
                      </div>
                    </td>
                    <td className="text-right font-bold">{tyre.Qty}</td>
                    <td>
                      <select
                        className="text-input"
                        value={localAllocations[tyre.ID] || ""}
                        onChange={(e) => actions.updateAllocation(tyre.ID, Number(e.target.value))}
                      >
                        <LocationOptions
                          locations={locations}
                          tyreQty={tyre.Qty}
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