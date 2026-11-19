import { useCallback } from "react"
import { useNavigate, useParams } from "@/lib/router"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { BranchForm } from "../components/BranchForm"
import { useBranchForm } from "../hooks/useBranchForm"
import { branchService } from "../services/branchService"

export default function BranchFormPage() {
  const navigate = useNavigate()
  const { branchId } = useParams()
  const { showToast } = useToast()
  const parsedBranchId = branchId ? Number(branchId) : undefined
  const isEditMode = parsedBranchId !== undefined

  const handleSuccess = useCallback(() => {
    showToast({
      variant: "success",
      title: isEditMode ? "Branch updated" : "Branch created",
      message: isEditMode
        ? "The branch was updated successfully."
        : "The branch was saved successfully.",
    })
    navigate("..")
  }, [isEditMode, navigate, showToast])

  const handleError = useCallback((message: string) => {
    showToast({
      variant: "error",
      title: isEditMode ? "Failed to update branch" : "Failed to create branch",
      message,
    })
  }, [isEditMode, showToast])

  const { formData, submitting, initializing, updateField, handleSubmit } = useBranchForm({
    branchId: parsedBranchId,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const fetchSuggestions = useCallback(
    (field: string, query: string) => branchService.suggest(field, query),
    [],
  )

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Branch Form</p>
          <h2>{isEditMode ? "Edit branch" : "Insert branch"}</h2>
        </div>
      </div>
      {initializing ? <p className="hero-text">Loading branch...</p> : null}
      <BranchForm
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
