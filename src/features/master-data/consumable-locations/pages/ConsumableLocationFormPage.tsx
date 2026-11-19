import { useCallback } from "react"
import { useNavigate, useParams } from "@/lib/router"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { ConsumableLocationForm } from "../components/ConsumableLocationForm"
import { useConsumableLocationForm } from "../hooks/useConsumableLocationForm"
import { consumableLocationService } from "../services/consumableLocationService"

export default function ConsumableLocationFormPage() {
  const navigate = useNavigate()
  const { consumableLocationId } = useParams()
  const { showToast } = useToast()
  const parsedId = consumableLocationId ? Number(consumableLocationId) : undefined
  const isEditMode = parsedId !== undefined

  const handleSuccess = useCallback(() => {
    showToast({
      variant: "success",
      title: isEditMode ? "Consumable location updated" : "Consumable location created",
      message: isEditMode
        ? "The consumable location was updated successfully."
        : "The consumable location was saved successfully.",
    })
    navigate("..")
  }, [isEditMode, navigate, showToast])

  const handleError = useCallback((message: string) => {
    showToast({
      variant: "error",
      title: isEditMode
        ? "Failed to update consumable location"
        : "Failed to create consumable location",
      message,
    })
  }, [isEditMode, showToast])

  const {
    formData,
    submitting,
    initializing,
    branches,
    loadingBranches,
    locationTypes,
    loadingLocationTypes,
    updateField,
    handleSubmit,
  } = useConsumableLocationForm({
    locationId: parsedId,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const fetchSuggestions = useCallback(
    (field: string, query: string) => consumableLocationService.suggest(field, query),
    [],
  )

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Consumable Location Form</p>
          <h2>{isEditMode ? "Edit consumable location" : "Insert consumable location"}</h2>
        </div>
      </div>
      {initializing ? <p className="hero-text">Loading consumable location...</p> : null}
      <ConsumableLocationForm
        formData={formData}
        branches={branches}
        locationTypes={locationTypes}
        onChange={updateField}
        onSubmit={handleSubmit}
        onCancel={() => navigate("..")}
        submitting={submitting || initializing}
        loadingBranches={loadingBranches}
        loadingLocationTypes={loadingLocationTypes}
        fetchSuggestions={fetchSuggestions}
      />
    </section>
  )
}
