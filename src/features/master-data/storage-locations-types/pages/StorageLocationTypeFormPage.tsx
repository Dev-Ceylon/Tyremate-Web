import { useCallback } from "react"
import { useNavigate, useParams } from "@/lib/router"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { StorageLocationTypeForm } from "../components/StorageLocationTypeForm"
import { useStorageLocationTypeForm } from "../hooks/useStorageLocationTypeForm"
import { storageLocationTypeService } from "../services/storageLocationTypeService"

export default function StorageLocationTypeFormPage() {
  const navigate = useNavigate()
  const { storageLocationTypeId } = useParams()
  const { showToast } = useToast()
  const parsedId = storageLocationTypeId ? Number(storageLocationTypeId) : undefined
  const isEditMode = parsedId !== undefined

  const handleSuccess = useCallback(() => {
    showToast({
      variant: "success",
      title: isEditMode ? "Storage location type updated" : "Storage location type created",
      message: isEditMode
        ? "The storage location type was updated successfully."
        : "The storage location type was saved successfully.",
    })
    navigate("..")
  }, [isEditMode, navigate, showToast])

  const handleError = useCallback((message: string) => {
    showToast({
      variant: "error",
      title: isEditMode
        ? "Failed to update storage location type"
        : "Failed to create storage location type",
      message,
    })
  }, [isEditMode, showToast])

  const {
    formData,
    submitting,
    initializing,
    updateField,
    handleSubmit,
  } = useStorageLocationTypeForm({
    storageLocationTypeId: parsedId,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const fetchSuggestions = useCallback(
    (field: string, query: string) => storageLocationTypeService.suggest(field, query),
    [],
  )

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Storage Location Type Form</p>
          <h2>{isEditMode ? "Edit storage location type" : "Insert storage location type"}</h2>
        </div>
      </div>
      {initializing ? <p className="hero-text">Loading storage location type...</p> : null}
      <StorageLocationTypeForm
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