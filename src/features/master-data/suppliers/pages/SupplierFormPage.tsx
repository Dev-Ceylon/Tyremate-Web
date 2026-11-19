import { useCallback } from "react"
import { useNavigate, useParams } from "@/lib/router"
import { SupplierForm } from "../components/SupplierForm"
import { useSupplierForm } from "../hooks/useSupplierForm"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { supplierService } from "../services/supplierService"

export default function SupplierFormPage() {
  const navigate = useNavigate()
  const { supplierId } = useParams()
  const { showToast } = useToast()
  const parsedSupplierId = supplierId ? Number(supplierId) : undefined
  const isEditMode = parsedSupplierId !== undefined
  const handleSuccess = useCallback(() => {
    showToast({
      variant: "success",
      title: isEditMode ? "Supplier updated" : "Supplier created",
      message: isEditMode
        ? "The supplier was updated successfully."
        : "The supplier was saved successfully.",
    })
    navigate("..")
  }, [isEditMode, navigate, showToast])

  const handleError = useCallback((message: string) => {
    showToast({
      variant: "error",
      title: isEditMode
        ? "Failed to update supplier"
        : "Failed to create supplier",
      message,
    })
  }, [isEditMode, showToast])

  const {
    formData,
    availableTyres,
    tyresLoading,
    tyresError,
    submitting,
    initializing,
    updateField,
    handleSubmit,
    loadTyresOnDemand,
    reloadTyres,
  } = useSupplierForm({
    supplierId: parsedSupplierId,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const fetchSuggestions = useCallback(
    (field: string, query: string) => supplierService.suggest(field, query),
    [],
  )

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Supplier Form</p>
          <h2>{isEditMode ? "Edit supplier" : "Insert supplier"}</h2>
        </div>
      </div>
      {initializing ? <p className="hero-text">Loading supplier...</p> : null}
      <SupplierForm
        formData={formData}
        availableTyres={availableTyres}
        tyresLoading={tyresLoading}
        tyresError={tyresError}
        onOpenTyrePicker={loadTyresOnDemand}
        onTyreCreated={reloadTyres}
        onChange={updateField}
        onSubmit={handleSubmit}
        onCancel={() => navigate("..")}
        submitting={submitting || initializing}
        isEdit={isEditMode}
        fetchSuggestions={fetchSuggestions}
      />
    </section>
  )
}
