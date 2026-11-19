import { useCallback, useEffect } from "react"
import { AppModal } from "../../../../shared/ui/modal/AppModal"
import type { TyreRecord } from "../models/tyre"
import { useTyreForm } from "../hooks/useTyreForm"
import { tyreService } from "../services/tyreService"
import { TyreForm } from "./TyreForm"

type CreateTyreDialogProps = {
  isOpen: boolean
  onClose: () => void
  onCreated: (tyre: TyreRecord) => void
  hideSupplier?: boolean
}

export function CreateTyreDialog({ isOpen, onClose, onCreated, hideSupplier = false }: CreateTyreDialogProps) {
  const { formData, suppliers, submitting, error, updateField, handleSubmit, resetForm, loadSuppliers } =
    useTyreForm({
      autoLoad: false,
      onSuccess: (createdTyre) => {
        if (createdTyre) {
          onCreated(createdTyre)
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
    (field: string, query: string) => tyreService.suggest(field, query),
    [],
  )

  return (
    <AppModal isOpen={isOpen} title="Create New Tyre" onClose={handleClose}>
      {error ? <p className="hero-text">{error}</p> : null}
      <TyreForm
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
