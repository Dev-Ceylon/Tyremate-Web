import { useCallback } from "react"
import { useNavigate, useParams } from "@/lib/router"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { BatteryLocationForm } from "../components/BatteryLocationForm"
import { useBatteryLocationForm } from "../hooks/useBatteryLocationForm"
import { batteryLocationService } from "../services/batteryLocationService"

export default function BatteryLocationFormPage() {
  const navigate = useNavigate()
  const { batteryLocationId } = useParams()
  const { showToast } = useToast()
  const parsedId = batteryLocationId ? Number(batteryLocationId) : undefined
  const isEditMode = parsedId !== undefined

  const handleSuccess = useCallback(() => {
    showToast({
      variant: "success",
      title: isEditMode ? "Battery location updated" : "Battery location created",
      message: isEditMode
        ? "The battery location was updated successfully."
        : "The battery location was saved successfully.",
    })
    navigate("..")
  }, [isEditMode, navigate, showToast])

  const handleError = useCallback((message: string) => {
    showToast({
      variant: "error",
      title: isEditMode
        ? "Failed to update battery location"
        : "Failed to create battery location",
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
  } = useBatteryLocationForm({
    locationId: parsedId,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const fetchSuggestions = useCallback(
    (field: string, query: string) => batteryLocationService.suggest(field, query),
    [],
  )

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Battery Location Form</p>
          <h2>{isEditMode ? "Edit battery location" : "Insert battery location"}</h2>
        </div>
      </div>
      {initializing ? <p className="hero-text">Loading battery location...</p> : null}
      <BatteryLocationForm
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
