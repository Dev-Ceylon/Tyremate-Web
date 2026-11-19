import { useCallback } from "react"
import { useNavigate, useParams } from "@/lib/router"
import { ConsumableForm } from "../components/ConsumableForm"
import { useConsumableForm } from "../hooks/useConsumableForm"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { consumableService } from "../services/consumableService"

export default function ConsumableFormPage() {
  const navigate = useNavigate()
  const { consumableId } = useParams()
  const { showToast } = useToast()
  const parsedId = consumableId ? Number(consumableId) : undefined
  const isEditMode = parsedId !== undefined

  const handleSuccess = useCallback(() => {
    showToast({
      variant: "success",
      title: isEditMode ? "Consumable updated" : "Consumable created",
      message: isEditMode
        ? "The consumable was updated successfully."
        : "The consumable was saved successfully.",
    })
    navigate("..")
  }, [isEditMode, navigate, showToast])

  const handleError = useCallback((message: string) => {
    showToast({
      variant: "error",
      title: isEditMode ? "Failed to update consumable" : "Failed to create consumable",
      message,
    })
  }, [isEditMode, showToast])

  const { formData, submitting, initializing, error, updateField, handleSubmit } = useConsumableForm({
    consumableId: parsedId,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const fetchSuggestions = useCallback(
    (field: string, query: string) => consumableService.suggest(field, query),
    [],
  )

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Consumable Form</p>
          <h2>{isEditMode ? "Edit consumable" : "Insert consumable"}</h2>
        </div>
      </div>
      {initializing ? <p className="hero-text">Loading consumable...</p> : null}
      {error && !initializing ? <p className="hero-text">{error}</p> : null}
      <ConsumableForm
        formData={formData}
        onChange={updateField}
        onSubmit={handleSubmit}
        onCancel={() => navigate("..")}
        submitting={submitting || initializing}
        fetchSuggestions={fetchSuggestions}
      />
    </section>
  )
}
