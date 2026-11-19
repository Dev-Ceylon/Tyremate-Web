import { useCallback } from "react"
import { useNavigate, useParams } from "@/lib/router"
import { CustomerForm } from "../components/CustomerForm"
import { useCustomerForm } from "../hooks/useCustomerForm"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { customerService } from "../services/customerService"

export default function CustomerFormPage() {
  const navigate = useNavigate()
  const { customerId } = useParams()
  const { showToast } = useToast()
  const parsedCustomerId = customerId ? Number(customerId) : undefined
  const isEditMode = parsedCustomerId !== undefined

  const handleSuccess = useCallback(() => {
    showToast({
      variant: "success",
      title: isEditMode ? "Customer updated" : "Customer created",
      message: isEditMode
        ? "The customer was updated successfully."
        : "The customer was saved successfully.",
    })
    navigate("..")
  }, [isEditMode, navigate, showToast])

  const handleError = useCallback((message: string) => {
    showToast({
      variant: "error",
      title: isEditMode
        ? "Failed to update customer"
        : "Failed to create customer",
      message,
    })
  }, [isEditMode, showToast])

  const { formData, submitting, initializing, updateField, handleSubmit } = useCustomerForm({
    customerId: parsedCustomerId,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const fetchSuggestions = useCallback(
    (field: string, query: string) => customerService.suggest(field, query),
    [],
  )

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Customer Form</p>
          <h2>{isEditMode ? "Edit customer" : "Insert customer"}</h2>
        </div>
      </div>
      {initializing ? <p className="hero-text">Loading customer...</p> : null}
      <CustomerForm
        formData={formData}
        onChange={updateField}
        onSubmit={handleSubmit}
        onCancel={() => navigate("..")}
        submitting={submitting || initializing}
        isEdit={isEditMode}
        fetchSuggestions={fetchSuggestions}
      />
    </section>
  )
}
