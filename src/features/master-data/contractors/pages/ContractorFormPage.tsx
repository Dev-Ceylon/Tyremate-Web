import { useCallback } from "react"
import { useNavigate, useParams } from "@/lib/router"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { ContractorForm } from "../components/ContractorForm"
import { useContractorForm } from "../hooks/useContractorForm"
import { contractorService } from "../services/contractorService"

export default function ContractorFormPage() {
  const navigate = useNavigate()
  const { contractorId } = useParams()
  const { showToast } = useToast()
  const parsedContractorId = contractorId ? Number(contractorId) : undefined
  const isEditMode = parsedContractorId !== undefined
  const handleSuccess = useCallback(() => {
    showToast({
      variant: "success",
      title: isEditMode ? "Contractor updated" : "Contractor created",
      message: isEditMode
        ? "The contractor was updated successfully."
        : "The contractor was saved successfully.",
    })
    navigate("..")
  }, [isEditMode, navigate, showToast])

  const handleError = useCallback((message: string) => {
    showToast({
      variant: "error",
      title: isEditMode
        ? "Failed to update contractor"
        : "Failed to create contractor",
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
  } = useContractorForm({
    contractorId: parsedContractorId,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const fetchSuggestions = useCallback(
    (field: string, query: string) => contractorService.suggest(field, query),
    [],
  )

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Contractor Form</p>
          <h2>{isEditMode ? "Edit contractor" : "Insert contractor"}</h2>
        </div>
      </div>
      {initializing ? <p className="hero-text">Loading contractor...</p> : null}
      <ContractorForm
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
        fetchSuggestions={fetchSuggestions}
      />
    </section>
  )
}
