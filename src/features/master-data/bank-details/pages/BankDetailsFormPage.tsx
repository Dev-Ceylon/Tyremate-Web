import { useCallback } from "react"
import { useNavigate, useParams } from "@/lib/router"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { BankDetailsForm } from "../components/BankDetailsForm"
import { useBankDetailsForm } from "../hooks/useBankDetailsForm"
import { bankDetailsService } from "../services/bankDetailsService"

export default function BankDetailsFormPage() {
  const navigate = useNavigate()
  const { bankDetailId } = useParams()
  const { showToast } = useToast()
  const parsedBankDetailId = bankDetailId ? Number(bankDetailId) : undefined
  const isEditMode = parsedBankDetailId !== undefined

  const handleSuccess = useCallback(() => {
    showToast({
      variant: "success",
      title: isEditMode ? "Bank detail updated" : "Bank detail created",
      message: isEditMode
        ? "The bank detail was updated successfully."
        : "The bank detail was saved successfully.",
    })
    navigate("..")
  }, [isEditMode, navigate, showToast])

  const handleError = useCallback((message: string) => {
    showToast({
      variant: "error",
      title: isEditMode ? "Failed to update bank detail" : "Failed to create bank detail",
      message,
    })
  }, [isEditMode, showToast])

  const { formData, submitting, initializing, updateField, handleSubmit } = useBankDetailsForm({
    bankDetailId: parsedBankDetailId,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const fetchSuggestions = useCallback(
    (field: string, query: string) => bankDetailsService.suggest(field, query),
    [],
  )

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Bank Detail Form</p>
          <h2>{isEditMode ? "Edit bank detail" : "Insert bank detail"}</h2>
        </div>
      </div>
      {initializing ? <p className="hero-text">Loading bank detail...</p> : null}
      <BankDetailsForm
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