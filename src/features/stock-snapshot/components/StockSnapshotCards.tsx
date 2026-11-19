import type { StockSnapshotRecord } from "../models/stockSnapshot"

interface StockSnapshotCardsProps {
  data: StockSnapshotRecord[]
  loading: boolean
  onOrderClick?: (tyreId: number, record: StockSnapshotRecord) => void
}

export function StockSnapshotCards({ data, loading, onOrderClick }: StockSnapshotCardsProps) {
  if (loading) return <p className="hero-text">Loading stock snapshots...</p>
  if (data.length === 0) return <p className="hero-text">No stock records found.</p>

  return (
    <div className="tyre-cards-grid">
      {data.map((record) => (
        <article key={record.TyreID} className="tyre-card panel panel-strong">
          {/* Header: Size and Pattern */}
          <div className="tyre-card-header">
            <div>
              <h3 className="tyre-card-size">{record.Size || "N/A"}</h3>
              <p className="tyre-card-pattern">{record.Pattern || "No Pattern"}</p>
            </div>
            <div className="tyre-card-actions">
              <button
                type="button"
                className="primary-action tyre-card-order-btn"
                onClick={() => onOrderClick?.(record.TyreID, record)}
                disabled={loading}
              >
                Order
              </button>
            </div>
          </div>

          {/* Quantity Metrics */}
          <div className="tyre-card-metrics">
            <div className="tyre-metric tyre-metric-available">
              <span className="tyre-metric-label">Available</span>
              <strong className="tyre-metric-value">{record.AvailableToSellQty}</strong>
            </div>
            <div className="tyre-metric tyre-metric-allocated">
              <span className="tyre-metric-label">Allocated</span>
              <strong className="tyre-metric-value">{record.AllocatedSalesQty}</strong>
            </div>
            <div className="tyre-metric tyre-metric-onhand">
              <span className="tyre-metric-label">On Hand</span>
              <strong className="tyre-metric-value">{record.OnHandQty}</strong>
            </div>
          </div>

          {/* Technical Details */}
          {/* <div className="tyre-card-details">
            {record.LL_SR && (
              <div className="tyre-detail-item">
                <span className="tyre-detail-label">LL/SR:</span>
                <span className="tyre-detail-value">{record.LL_SR}</span>
              </div>
            )}
            {record.PR && (
              <div className="tyre-detail-item">
                <span className="tyre-detail-label">PR:</span>
                <span className="tyre-detail-value">{record.PR}</span>
              </div>
            )}
            {record.SideWall && (
              <div className="tyre-detail-item">
                <span className="tyre-detail-label">Side Wall:</span>
                <span className="tyre-detail-value">{record.SideWall}</span>
              </div>
            )}
          </div> */}

          {/* Supplier Information */}
          {(record.SupplierCodes || record.SupplierNames) && (
            <div className="tyre-card-suppliers">
              {record.SupplierCodes && (
                <p className="tyre-supplier-info">
                  <span className="tyre-detail-label">Suppliers:</span> {record.SupplierCodes}
                </p>
              )}
            </div>
          )}

          {/* Pricing Footer */}
          {/* {(record.PurchasedPrice != null || record.ActualSellingPrice != null) && (
            <div className="tyre-card-pricing">
              {record.PurchasedPrice != null && (
                <div className="tyre-price-item">
                  <span className="tyre-price-label">Purchased:</span>
                  <span className="tyre-price-value">
                    {record.PurchasedPrice.toLocaleString(undefined, { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })}
                  </span>
                </div>
              )}
              {record.ActualSellingPrice != null && (
                <div className="tyre-price-item">
                  <span className="tyre-price-label">Selling:</span>
                  <span className="tyre-price-value">
                    {record.ActualSellingPrice.toLocaleString(undefined, { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })}
                  </span>
                </div>
              )}
            </div>
          )} */}

          {/* ID Badge */}
          {/* <div className="tyre-card-id">
            <span className="font-mono text-small">ID: {record.TyreID}</span>
          </div> */}
        </article>
      ))}
    </div>
  )
}
