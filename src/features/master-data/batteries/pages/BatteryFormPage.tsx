import { useCallback } from "react"
import { useNavigate, useParams } from "@/lib/router"
import { BatteryForm } from "../components/BatteryForm"
import { useBatteryForm } from "../hooks/useBatteryForm"
import { batteryService } from "../services/batteryService"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"

export default function BatteryFormPage() {
  const navigate = useNavigate()
  const { batteryId } = useParams()
  const { showToast } = useToast()
  const parsedBatteryId = batteryId ? Number(batteryId) : undefined
  const isEditMode = parsedBatteryId !== undefined

  const handleSuccess = useCallback(() => {
    showToast({
      variant: "success",
      title: isEditMode ? "Battery updated" : "Battery created",
      message: isEditMode
        ? "The battery was updated successfully."
        : "The battery was saved successfully.",
    })
    navigate("..")
  }, [isEditMode, navigate, showToast])

  const handleError = useCallback((message: string) => {
    showToast({
      variant: "error",
      title: isEditMode ? "Failed to update battery" : "Failed to create battery",
      message,
    })
  }, [isEditMode, showToast])

  const { formData, suppliers, submitting, initializing, updateField, handleSubmit } = useBatteryForm({
    batteryId: parsedBatteryId,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const fetchSuggestions = useCallback(
    (field: string, query: string) => batteryService.suggest(field, query),
    [],
  )

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Battery Form</p>
          <h2>{isEditMode ? "Edit battery" : "Insert battery"}</h2>
        </div>
      </div>
      {initializing ? <p className="hero-text">Loading battery...</p> : null}
      <BatteryForm
        formData={formData}
        suppliers={suppliers}
        onChange={updateField}
        onSubmit={handleSubmit}
        onCancel={() => navigate("..")}
        submitting={submitting || initializing}
        fetchSuggestions={fetchSuggestions}
      />
    </section>
  )
}
