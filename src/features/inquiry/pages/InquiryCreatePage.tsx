import { useCallback, useState } from "react"
import { useNavigate, useSearchParams } from "@/lib/router"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { CreateCustomerDialog } from "../../master-data/customers/components/CreateCustomerDialog"
import type { CustomerRecord } from "../../master-data/customers/models/customer"
import { CreateTyreDialog } from "../../master-data/tyres/components/CreateTyreDialog"
import type { TyreRecord } from "../../master-data/tyres/models/tyre"
import { CreateBatteryDialog } from "../../master-data/batteries/components/CreateBatteryDialog"
import type { BatteryRecord } from "../../master-data/batteries/models/battery"
import { InquiryForm } from "../components/InquiryForm"
import { useInquiryForm } from "../hooks/useInquiryForm"
import type { InquiryCategory } from "../models/inquiry"

export default function InquiryCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const categoryParam = (searchParams.get("category") || "tyre").toLowerCase() as InquiryCategory
  const initialCategory: InquiryCategory = categoryParam === "battery" ? "battery" : "tyre"

  const { showToast } = useToast()
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false)
  const [isCreateTyreOpen, setIsCreateTyreOpen] = useState(false)
  const [isCreateBatteryOpen, setIsCreateBatteryOpen] = useState(false)

  const handleSuccess = useCallback(() => {
    showToast({
      variant: "success",
      title: "Inquiry created",
      message: "The inquiry has been saved successfully.",
    })
    navigate("/inquiries")
  }, [navigate, showToast])

  const handleError = useCallback((msg: string) => {
    showToast({
      variant: "error",
      title: "Failed to create inquiry",
      message: msg,
    })
  }, [showToast])

  const {
    formData,
    lines,
    customers,
    tyres,
    batteries,
    initializing,
    submitting,
    error,
    updateField,
    changeCategory,
    addLine,
    removeLine,
    updateLine,
    setLineTyre,
    setLineBattery,
    reloadCustomers,
    reloadTyres,
    reloadBatteries,
    changeCustomerMode,
    changeWalkinCustomer,
    selectCustomer,
    selectTyreForInquiry,
    selectBatteryForInquiry,
    walkinCustomerErrors,
    handleSubmit,
  } = useInquiryForm({ onSuccess: handleSuccess, onError: handleError, initialCategory })

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Sales</p>
          <h1>Create Inquiry</h1>
          <p className="hero-text">Log a new customer inquiry and track product specifications for review.</p>
        </div>
      </section>

      <section className="table-panel panel panel-strong">
        {initializing ? <p className="hero-text">Loading options...</p> : null}
        {error && !submitting ? <p className="hero-text error-text">{error}</p> : null}

        <InquiryForm
          state={{ formData, lines, customers, tyres, batteries, submitting, walkinCustomerErrors }}
          actions={{
            onChangeDate: (v) => updateField("Date", v),
            onChangeCategory: changeCategory,
            onChangeCustomer: (v) => updateField("CustomerID", v),
            onChangeCustomerMode: changeCustomerMode,
            onChangeWalkinCustomer: changeWalkinCustomer,
            onChangeNotes: (v) => updateField("Notes", v),
            onOpenCreateCustomer: () => setIsCreateCustomerOpen(true),
            onOpenCreateTyre: () => setIsCreateTyreOpen(true),
            onOpenCreateBattery: () => setIsCreateBatteryOpen(true),
            onAddLine: addLine,
            onRemoveLine: removeLine,
            onChangeLineTyre: setLineTyre,
            onChangeLineBattery: setLineBattery,
            onChangeLinePrice: (id, v) => updateLine(id, "Price", v),
            onChangeLineDiscount: (id, v) => updateLine(id, "Discount", v),
            onChangeLineQty: (id, v) => updateLine(id, "Qty", v),
            onSubmit: handleSubmit,
            onCancel: () => navigate("/inquiries"),
          }}
        />
      </section>

      <CreateCustomerDialog
        isOpen={isCreateCustomerOpen}
        onClose={() => setIsCreateCustomerOpen(false)}
        onCreated={async (c: CustomerRecord) => {
          await reloadCustomers()
          selectCustomer(c.CustomerID)
        }}
      />
      <CreateTyreDialog
        isOpen={isCreateTyreOpen}
        onClose={() => setIsCreateTyreOpen(false)}
        onCreated={async (t: TyreRecord) => {
          await reloadTyres()
          selectTyreForInquiry(t.Id)
        }}
      />
      <CreateBatteryDialog
        isOpen={isCreateBatteryOpen}
        onClose={() => setIsCreateBatteryOpen(false)}
        onCreated={async (b: BatteryRecord) => {
          await reloadBatteries()
          selectBatteryForInquiry(b.Id)
        }}
      />
    </main>
  )
}
