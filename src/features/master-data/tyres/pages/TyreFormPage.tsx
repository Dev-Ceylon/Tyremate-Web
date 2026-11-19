import { useCallback } from "react"
import { useNavigate, useParams } from "@/lib/router"
import { TyreForm } from "../components/TyreForm"
import { useTyreForm } from "../hooks/useTyreForm"
import { tyreService } from "../services/tyreService"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"

export default function TyreFormPage() {
  const navigate = useNavigate()
  const { tyreId } = useParams()
  const { showToast } = useToast()
  const parsedTyreId = tyreId ? Number(tyreId) : undefined
  const isEditMode = parsedTyreId !== undefined

  const handleSuccess = useCallback(() => {
    showToast({
      variant: "success",
      title: isEditMode ? "Tyre updated" : "Tyre created",
      message: isEditMode
        ? "The tyre was updated successfully."
        : "The tyre was saved successfully.",
    })
    navigate("..")
  }, [isEditMode, navigate, showToast])

  const handleError = useCallback((message: string) => {
    showToast({
      variant: "error",
      title: isEditMode ? "Failed to update tyre" : "Failed to create tyre",
      message,
    })
  }, [isEditMode, showToast])

  const { formData, suppliers, submitting, initializing, updateField, handleSubmit } = useTyreForm({
    tyreId: parsedTyreId,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const fetchSuggestions = useCallback(
    (field: string, query: string) => tyreService.suggest(field, query),
    [],
  )

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Tyre Form</p>
          <h2>{isEditMode ? "Edit tyre" : "Insert tyre"}</h2>
        </div>
      </div>
      {initializing ? <p className="hero-text">Loading tyre...</p> : null}
      <TyreForm
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
