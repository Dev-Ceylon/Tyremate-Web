import { useMemo, useState } from "react"
import { useNavigate } from "@/lib/router"
import { usePendingGoodsReceipts } from "../hooks/usePendingGoodsReceipts"
import { usePendingDagGoodsReceipts } from "../hooks/usePendingDagGoodsReceipts"
import { PendingGoodsReceiptTable } from "../components/PendingGoodsReceiptTable"
import { PendingDagGoodsReceiptTable } from "../components/PendingDagGoodsReceiptTable"
import { GoodsReceiptModal } from "../components/GoodsReceiptModal"
import { LoadingState } from "../../../shared/ui/progress"
import { FilterTabs } from "../../../shared/ui/filterTabs/FilterTabs"
import { TyreIcon, BatteryIcon } from "../../../shared/ui/icons"
import { formatOrderItemLabel } from "../../../shared/item/models/itemDisplay"
import type {
  DagGoodsReceiptPayload,
  GoodsReceiptPayload,
  GoodsReceiptSource,
  PendingDagGoodsReceiptRecord,
  PendingGoodsReceiptRecord,
} from "../models/goodsReceipt"

export default function PendingGoodsReceiptPage() {
  const navigate = useNavigate()
  const [source, setSource] = useState<GoodsReceiptSource>("po")
  const [poCategoryFilter, setPoCategoryFilter] = useState<"all" | "tyre" | "battery">("all")

  const [overdueOnly, setOverdueOnly] = useState(false)
  const [expectedFrom, setExpectedFrom] = useState("")
  const [expectedTo, setExpectedTo] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPo, setSelectedPo] = useState<PendingGoodsReceiptRecord | null>(null)
  const [selectedDag, setSelectedDag] = useState<PendingDagGoodsReceiptRecord | null>(null)

  const {
    rows: poRows,
    loading: poLoading,
    error: poError,
    isPosting: poPosting,
    postGoodsReceipt,
  } = usePendingGoodsReceipts({ expectedFrom, expectedTo, overdueOnly })

  const {
    rows: dagRows,
    loading: dagLoading,
    error: dagError,
    isPosting: dagPosting,
    postDagReceipt,
  } = usePendingDagGoodsReceipts()

  const handlePostPo = async (payload: GoodsReceiptPayload) => {
    await postGoodsReceipt(payload)
    setSelectedPo(null)
  }

  const handlePostDag = async (payload: DagGoodsReceiptPayload) => {
    await postDagReceipt(payload)
    setSelectedDag(null)
  }

  const visiblePoRows = useMemo(() => {
    let list = poRows
    if (poCategoryFilter === "tyre") {
      list = list.filter((r) => r.Category !== "battery")
    } else if (poCategoryFilter === "battery") {
      list = list.filter((r) => r.Category === "battery")
    }

    const query = searchQuery.trim().toLowerCase()
    if (!query) return list

    return list.filter((row) =>
      [
        String(row.POID),
        row.SupplierCode,
        row.SupplierName,
        row.Brand ?? "",
        row.Size ?? "",
        row.Pattern ?? "",
        row.Model ?? "",
        row.Capacity ?? "",
        row.Voltage ?? "",
        row.AllocatedLocationName ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    )
  }, [poRows, poCategoryFilter, searchQuery])

  const visibleDagRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return dagRows

    return dagRows.filter((row) =>
      [
        String(row.DAGID),
        row.CustomerName ?? "",
        row.Brand ?? "",
        row.Size ?? "",
        row.Pattern ?? "",
        row.QuarantineLocationName ?? "",
        row.DestinationLocationName ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    )
  }, [dagRows, searchQuery])

  const isFiltering = source === "po"
    ? overdueOnly || !!expectedFrom || !!expectedTo || !!searchQuery.trim() || poCategoryFilter !== "all"
    : !!searchQuery.trim()

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="section-label">Goods Receipts</p>
          <h1>Pending to GRN</h1>
          <p className="hero-text">
            {source === "po"
              ? "Supplier allocations that have been approved but are not fully received yet."
              : "DAG stock returned to quarantine that still needs to be received into sellable stock."}
          </p>
        </div>
      </section>

      <section className="table-panel panel panel-strong">
        <div className="table-panel-header">
          <FilterTabs
            tabs={[
              { key: "po", label: "Purchase Orders", badge: poRows.length },
              { key: "dag", label: "DAG", badge: dagRows.length },
            ]}
            activeKey={source}
            onChange={(key) => { setSource(key as GoodsReceiptSource); setSearchQuery("") }}
          />
          <span className="table-count">
            {source === "po"
              ? `${visiblePoRows.length} allocation${visiblePoRows.length === 1 ? "" : "s"} \u00b7 ${visiblePoRows.reduce((sum, row) => sum + row.PendingQty, 0)} item${visiblePoRows.reduce((sum, row) => sum + row.PendingQty, 0) === 1 ? "" : "s"} pending`
              : `${visibleDagRows.length} lot${visibleDagRows.length === 1 ? "" : "s"} \u00b7 ${visibleDagRows.reduce((sum, row) => sum + row.PendingQty, 0)} tyre${visibleDagRows.reduce((sum, row) => sum + row.PendingQty, 0) === 1 ? "" : "s"} in quarantine`}
          </span>
        </div>

        <div className="table-filter-controls">
          <label className="table-filter-field">
            <span className="filter-field-label">Search</span>
            <input
              type="search"
              className="text-input"
              placeholder={source === "po" ? "PO, supplier, tyre or battery" : "DAG, customer or tyre"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>

          {source === "po" && (
            <>
              <div className="table-filter-field">
                <span className="filter-field-label">Category</span>
                <div className="po-category-segment" role="radiogroup" aria-label="Filter item category">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={poCategoryFilter === "all"}
                    className={`po-category-pill ${poCategoryFilter === "all" ? "po-category-pill-active" : ""}`}
                    onClick={() => setPoCategoryFilter("all")}
                  >
                    <span>All</span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={poCategoryFilter === "tyre"}
                    className={`po-category-pill ${poCategoryFilter === "tyre" ? "po-category-pill-active" : ""}`}
                    onClick={() => setPoCategoryFilter("tyre")}
                  >
                    <TyreIcon />
                    <span>Tyres</span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={poCategoryFilter === "battery"}
                    className={`po-category-pill ${poCategoryFilter === "battery" ? "po-category-pill-active" : ""}`}
                    onClick={() => setPoCategoryFilter("battery")}
                  >
                    <BatteryIcon />
                    <span>Batteries</span>
                  </button>
                </div>
              </div>

              <label className="table-filter-field">
                <span className="filter-field-label">Expected From</span>
                <input
                  type="date"
                  className="text-input"
                  value={expectedFrom}
                  onChange={(e) => setExpectedFrom(e.target.value)}
                />
              </label>

              <label className="table-filter-field">
                <span className="filter-field-label">Expected To</span>
                <input
                  type="date"
                  className="text-input"
                  value={expectedTo}
                  onChange={(e) => setExpectedTo(e.target.value)}
                />
              </label>

              <label className="table-filter-field">
                <span className="filter-field-label">Delivery</span>
                <span className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={overdueOnly}
                    onChange={(e) => setOverdueOnly(e.target.checked)}
                  />
                  Overdue only
                </span>
              </label>
            </>
          )}

          {isFiltering && (
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setSearchQuery("")
                setExpectedFrom("")
                setExpectedTo("")
                setOverdueOnly(false)
                setPoCategoryFilter("all")
              }}
            >
              Clear
            </button>
          )}
        </div>

        {source === "po" ? (
          poLoading ? (
            <LoadingState message="Loading pending goods receipts…" />
          ) : poError ? (
            <p className="hero-text error-text">{poError}</p>
          ) : (
            <PendingGoodsReceiptTable
              data={visiblePoRows}
              onReceive={setSelectedPo}
              onOpenPurchaseOrder={(poId) => navigate(`/purchase-orders/${poId}`)}
            />
          )
        ) : dagLoading ? (
          <LoadingState message="Loading quarantine stock…" />
        ) : dagError ? (
          <p className="hero-text error-text">{dagError}</p>
        ) : (
          <PendingDagGoodsReceiptTable
            data={visibleDagRows}
            onReceive={setSelectedDag}
            onOpenDag={(dagId) => navigate(`/dag/${dagId}`)}
          />
        )}
      </section>

      {selectedPo && (
        <GoodsReceiptModal
          source="po"
          isOpen
          poId={selectedPo.POID}
          category={selectedPo.Category}
          supplierAllocationId={selectedPo.PoBatterySupplierID ?? selectedPo.PoTyresSupplierID}
          supplierName={selectedPo.SupplierName}
          tyreLabel={formatOrderItemLabel(selectedPo)}
          allocationQty={selectedPo.AllocatedQty}
          receivedToDate={selectedPo.AcceptedToDateQty}
          locationName={selectedPo.AllocatedLocationName ?? "-"}
          isSaving={poPosting}
          onClose={() => setSelectedPo(null)}
          onPost={handlePostPo}
        />
      )}

      {selectedDag && (
        <GoodsReceiptModal
          key={selectedDag.SourceStorageManagerID}
          source="dag"
          isOpen
          pending={selectedDag}
          isSaving={dagPosting}
          onClose={() => setSelectedDag(null)}
          onPost={handlePostDag}
        />
      )}
    </main>
  )
}
