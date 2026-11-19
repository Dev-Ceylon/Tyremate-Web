import { useCallback } from "react"
import { useNavigate, useParams } from "@/lib/router"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { StorageLocationForm } from "../components/StorageLocationForm"
import { useStorageLocationForm } from "../hooks/useStorageLocationForm"
import { storageLocationService } from "../services/storageLocationService"

export default function StorageLocationFormPage() {
  const navigate = useNavigate()
  const { storageLocationId } = useParams()
  const { showToast } = useToast()
  const parsedStorageLocationId = storageLocationId ? Number(storageLocationId) : undefined
  const isEditMode = parsedStorageLocationId !== undefined

  const handleSuccess = useCallback(() => {
    showToast({
      variant: "success",
      title: isEditMode ? "Storage location updated" : "Storage location created",
      message: isEditMode
        ? "The storage location was updated successfully."
        : "The storage location was saved successfully.",
    })
    navigate("..")
  }, [isEditMode, navigate, showToast])

  const handleError = useCallback((message: string) => {
    showToast({
      variant: "error",
      title: isEditMode
        ? "Failed to update storage location"
        : "Failed to create storage location",
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
  } = useStorageLocationForm({
    storageLocationId: parsedStorageLocationId,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const fetchSuggestions = useCallback(
    (field: string, query: string) => storageLocationService.suggest(field, query),
    [],
  )

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Storage Location Form</p>
          <h2>{isEditMode ? "Edit storage location" : "Insert storage location"}</h2>
        </div>
      </div>
      {initializing ? <p className="hero-text">Loading storage location...</p> : null}
      <StorageLocationForm
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
