import { useCallback, useState } from "react"
import { useNavigate } from "@/lib/router"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { CreateCustomerDialog } from "../../master-data/customers/components/CreateCustomerDialog"
import type { CustomerRecord } from "../../master-data/customers/models/customer"
import { DagForm } from "../components/DagForm"
import { useDagForm } from "../hooks/useDagForm"

export default function DagFormPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false)

  const navigateToDagList = useCallback(() => navigate("/dag"), [navigate])

  const handleSuccess = useCallback(() => {
    showToast({
      variant: "success",
      title: "DAG created",
      message: "The DAG was created successfully.",
    })
    navigateToDagList()
  }, [navigateToDagList, showToast])

  const handleError = useCallback(
    (message: string) => {
      showToast({
        variant: "error",
        title: "Create failed",
        message,
      })
    },
    [showToast],
  )

  const {
    formData,
    lines,
    customers,
    tyres,
    storageLocations,
    initializing,
    submitting,
    error,
    updateField,
    setCustomerMode,
    updateWalkinCustomer,
    handleBlurWalkinCustomer,
    walkinCustomerErrors,
    addLine,
    removeLine,
    handleLineTyre,
    handleLineStorageLocation,
    handleLineSerials,
    addLineSerial,
    removeLineSerial,
    handleLineSerialNumber,
    handleLineSerialCost,
    handleSubmit,
    reloadCustomers,
    selectCustomer,
  } = useDagForm({ onSuccess: handleSuccess, onError: handleError })

  const handleCustomerCreated = useCallback(
    async (customer: CustomerRecord) => {
      await reloadCustomers()
      selectCustomer(customer.CustomerID)
      showToast({
        variant: "success",
        title: "Customer created",
        message: "New customer is ready and selected for this DAG.",
      })
    },
    [reloadCustomers, selectCustomer, showToast],
  )

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">DAG</p>
          <h1>Create DAG</h1>
          <p className="hero-text">Create a new DAG and add tyre lines for inventory movement.</p>
        </div>
      </section>

      <section className="table-panel panel panel-strong">
        {initializing ? <p className="hero-text">Loading form options...</p> : null}
        {error ? <p className="hero-text">{error}</p> : null}
        {!initializing ? (
          <DagForm
            state={{
              formData,
              customers,
              tyres,
              storageLocations,
              lines,
              submitting,
              walkinCustomerErrors,
            }}
            actions={{
              onChange: updateField,
              onChangeCustomerMode: setCustomerMode,
              onChangeWalkinCustomer: updateWalkinCustomer,
              onBlurWalkinCustomer: handleBlurWalkinCustomer,
              onAddLine: addLine,
              onRemoveLine: removeLine,
              onChangeLineTyre: handleLineTyre,
              onChangeLineStorageLocation: handleLineStorageLocation,
              onChangeLineSerials: handleLineSerials,
              onAddLineSerial: addLineSerial,
              onRemoveLineSerial: removeLineSerial,
              onChangeLineSerialNumber: handleLineSerialNumber,
              onChangeLineSerialCost: handleLineSerialCost,
              onOpenCreateCustomer: () => setIsCreateCustomerOpen(true),
              onSubmit: handleSubmit,
              onCancel: navigateToDagList,
            }}
          />
        ) : null}
      </section>

      <CreateCustomerDialog
        isOpen={isCreateCustomerOpen}
        onClose={() => setIsCreateCustomerOpen(false)}
        onCreated={handleCustomerCreated}
      />
    </main>
  )
}
