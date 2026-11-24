import { useCallback, useEffect } from "react"
import { AppModal } from "../../../../shared/ui/modal/AppModal"
import type { BatteryRecord } from "../models/battery"
import { useBatteryForm } from "../hooks/useBatteryForm"
import { batteryService } from "../services/batteryService"
import { BatteryForm } from "./BatteryForm"

type CreateBatteryDialogProps = {
  isOpen: boolean
  onClose: () => void
  onCreated: (battery: BatteryRecord) => void
  hideSupplier?: boolean
}

export function CreateBatteryDialog({
  isOpen,
  onClose,
  onCreated,
  hideSupplier = false,
}: CreateBatteryDialogProps) {
  const {
    formData,
    suppliers,
    submitting,
    error,
    updateField,
    handleSubmit,
    resetForm,
    loadSuppliers,
  } = useBatteryForm({
    autoLoad: false,
    onSuccess: (createdBattery) => {
      if (createdBattery) {
        onCreated(createdBattery)
      }
      resetForm()
      onClose()
    },
  })

  useEffect(() => {
    if (!isOpen) {
      return
    }

    let active = true

    const fetchSuppliers = async () => {
      await loadSuppliers(() => active)
    }

    void fetchSuppliers()

    return () => {
      active = false
    }
  }, [isOpen, loadSuppliers])

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const fetchSuggestions = useCallback(
    (field: string, query: string) => batteryService.suggest(field, query),
    [],
  )

  return (
    <AppModal isOpen={isOpen} title="Create New Battery" onClose={handleClose}>
      {error ? <p className="hero-text">{error}</p> : null}
      <BatteryForm
        formData={formData}
        suppliers={suppliers}
        onChange={updateField}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        submitting={submitting}
        hideSupplier={hideSupplier}
        fetchSuggestions={fetchSuggestions}
      />
    </AppModal>
  )
}
