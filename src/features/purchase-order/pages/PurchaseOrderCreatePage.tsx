import { useState, useCallback } from "react"
import { useSearchParams, useNavigate } from "@/lib/router"
import { PurchaseOrderForm } from "../components/PurchaseOrderForm"
import { SupplierSelectionModal } from "../components/SupplierSelectionModal"
import { CreateTyreDialog } from "../../master-data/tyres/components/CreateTyreDialog"
import { usePurchaseOrderCreate } from "../hooks/usePurchaseOrderCreate"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import type { TyreRecord } from "../../master-data/tyres/models/tyre"

export default function PurchaseOrderCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inquiryIdParam = searchParams.get("inquiryId")
  const inquiryId = inquiryIdParam ? Number(inquiryIdParam) : null
  const { formState, formActions, modalState, modalActions } = usePurchaseOrderCreate(inquiryId)
  const { showToast } = useToast()
  const [isCreateTyreOpen, setIsCreateTyreOpen] = useState(false)

  const handleTyreCreated = useCallback(
    async (tyre: TyreRecord) => {
      await formActions.reloadTyres()
      formActions.selectTyreForOrder(tyre.Id)
      showToast({
        variant: "success",
        title: "Tyre created",
        message: "New tyre is ready and added to this purchase order.",
      })
    },
    [formActions, showToast],
  )

  const handleCancel = () => {
    if (inquiryId) {
      navigate(`/inquiries/${inquiryId}`)
    } else {
      navigate("/purchase-orders")
    }
  }

  return (
    <main className="app-shell">
      <section className="table-panel panel panel-strong">
        <div className="table-panel-header">
          <div>
            <p className="section-label">Purchase Order</p>
            <h2>Create Purchase Order{inquiryId ? ` from Inquiry #${inquiryId}` : ""}</h2>
          </div>
        </div>

        {formState.initializing ? <p className="hero-text">Loading options...</p> : null}
        {formState.error ? <p className="hero-text">{formState.error}</p> : null}

        <PurchaseOrderForm
          state={formState}
          actions={formActions}
          onOpenCreateTyre={() => setIsCreateTyreOpen(true)}
          onCancel={handleCancel}
        />

        {modalState.activeLine && (
          <SupplierSelectionModal
            isOpen={modalState.isOpen}
            onClose={modalActions.onClose}
            tyreId={modalState.activeLine.TyreID}
            tyreLabel={modalState.tyreLabel}
            lineQty={modalState.activeLine.Qty}
            existingSuppliers={modalState.activeLine.Suppliers}
            onConfirm={modalActions.onConfirm}
          />
        )}

        <CreateTyreDialog
          isOpen={isCreateTyreOpen}
          onClose={() => setIsCreateTyreOpen(false)}
          onCreated={handleTyreCreated}
        />
      </section>
    </main>
  )
}
