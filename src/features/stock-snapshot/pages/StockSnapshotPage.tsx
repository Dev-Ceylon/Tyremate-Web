import { useState } from "react"
import { useNavigate } from "@/lib/router"
import { useStockSnapshots } from "../hooks/useStockSnapshots"
import { StockSnapshotCards } from "../components/StockSnapshotCards"
import { QuickOrderModal, type QuickOrderData } from "../components/QuickOrderModal"
import type { StockSnapshotRecord } from "../models/stockSnapshot"

export default function StockSnapshotPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [selectedTyre, setSelectedTyre] = useState<StockSnapshotRecord | null>(null)

  const { stockSnapshots, filteredStockSnapshots, loading, error } = useStockSnapshots(searchQuery)

  const handleOrderClick = (_tyreId: number, record: StockSnapshotRecord) => {
    setSelectedTyre(record)
    setIsOrderModalOpen(true)
  }

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false)
    setSelectedTyre(null)
  }

  const handleCreateOrder = (orderData: QuickOrderData) => {
    navigate("/sales-orders/new", {
      state: {
        selectedTyre,
        orderData,
      },
    })
    handleCloseOrderModal()
  }

  const summary = {
    totalTyres: stockSnapshots.length,
    onHand: stockSnapshots.reduce((sum, s) => sum + s.OnHandQty, 0),
    allocated: stockSnapshots.reduce((sum, s) => sum + s.AllocatedSalesQty, 0),
    available: stockSnapshots.reduce((sum, s) => sum + s.AvailableToSellQty, 0),
  }

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Inventory Reports</p>
          <h1>Stock Snapshot</h1>
          <p className="hero-text">
            Real-time overview of tyre inventory, allocations, and net availability.
          </p>
        </div>
      </section>

      <section className="metrics-grid stock-summary-grid">
        <article className="metric-card panel">
          <span className="metric-label">Total Tyre Types</span>
          <strong>{summary.totalTyres}</strong>
        </article>
        <article className="metric-card panel border-on-hand">
          <span className="metric-label">Total On Hand</span>
          <strong>{summary.onHand}</strong>
        </article>
        <article className="metric-card panel border-allocated">
          <span className="metric-label">Allocated to Sales</span>
          <strong className="text-warning">{summary.allocated}</strong>
        </article>
        <article className="metric-card panel border-available">
          <span className="metric-label">Available to Sell</span>
          <strong className="text-success">{summary.available}</strong>
        </article>
      </section>

      <section className="cards-panel">
        <div className="section-header">
          <div>
            <p className="section-label">Stock Cards</p>
            <h2>Tyre Inventory Cards</h2>
          </div>
          <div className="search-input-wrapper">
            <input
              type="text"
              className="text-input search-input"
              placeholder="Search by size, pattern, ID, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="search-clear-button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {searchQuery && (
          <div className="search-results-info">
            <p className="hero-text">
              Found {filteredStockSnapshots.length} of {stockSnapshots.length} tyres
            </p>
          </div>
        )}
        {error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : (
          <StockSnapshotCards
            data={filteredStockSnapshots}
            loading={loading}
            onOrderClick={handleOrderClick}
          />
        )}
      </section>

      <QuickOrderModal 
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
        tyre={selectedTyre}
        onCreateOrder={handleCreateOrder}
      />
    </main>
  )
}
