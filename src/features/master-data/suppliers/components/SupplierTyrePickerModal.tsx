import { useEffect, useMemo, useState } from "react"
import { AppModal } from "../../../../shared/ui/modal/AppModal"
import { formatTyreLabel } from "../../../../shared/tyre/models/tyreDisplay"
import { CreateTyreDialog } from "../../tyres/components/CreateTyreDialog"
import type { TyreRecord } from "../../tyres/models/tyre"
import type { SupplierTyreAssociation } from "../models/supplier"

type SupplierTyrePickerModalProps = {
  isOpen: boolean
  selectedTyres: SupplierTyreAssociation[]
  availableTyres: TyreRecord[]
  loading?: boolean
  error?: string | null
  onApply: (tyres: SupplierTyreAssociation[]) => void
  onClose: () => void
  onTyreCreated?: (tyre: TyreRecord) => void
}

export function SupplierTyrePickerModal({
  isOpen,
  selectedTyres,
  availableTyres,
  loading = false,
  error = null,
  onApply,
  onClose,
  onTyreCreated,
}: SupplierTyrePickerModalProps) {
  const [draftTyres, setDraftTyres] = useState<SupplierTyreAssociation[]>(selectedTyres)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isCreateTyreOpen, setIsCreateTyreOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setDraftTyres(selectedTyres)
      setValidationError(null)
    }
  }, [isOpen, selectedTyres])

  const draftTyresById = useMemo(
    () => new Map(draftTyres.map((tyre) => [tyre.TyreID, tyre])),
    [draftTyres],
  )

  const toggleTyre = (tyre: TyreRecord) => {
    setValidationError(null)
    setDraftTyres((current) => {
      const existing = current.find((item) => item.TyreID === tyre.Id)

      if (existing) {
        return current.filter((item) => item.TyreID !== tyre.Id)
      }

      return [
        ...current,
        {
          TyreID: tyre.Id,
          Price: null,
          Brand: tyre.Brand ?? null,
          Size: tyre.Size ?? null,
          Pattern: tyre.Pattern ?? null,
          LL_SR: tyre.LL_SR ?? null,
          PR: tyre.PR ?? null,
          SideWall: tyre.SideWall ?? null,
        },
      ]
    })
  }

  const updatePrice = (tyreId: number, value: string) => {
    setValidationError(null)
    setDraftTyres((current) =>
      current.map((item) =>
        item.TyreID === tyreId
          ? { ...item, Price: value === "" ? null : Number(value) }
          : item,
      ),
    )
  }

  const handleApply = () => {
    const invalidTyre = draftTyres.find(
      (item) => item.Price === null || !Number.isFinite(item.Price) || item.Price < 0,
    )

    if (invalidTyre) {
      setValidationError(`Enter a valid price for tyre ${invalidTyre.TyreID}.`)
      return
    }

    onApply(draftTyres)
    onClose()
  }

  const handleTyreCreated = (tyre: TyreRecord) => {
    onTyreCreated?.(tyre)
    setDraftTyres((current) => {
      if (current.find((item) => item.TyreID === tyre.Id)) {
        return current
      }

      return [
        ...current,
        {
          TyreID: tyre.Id,
          Price: null,
          Brand: tyre.Brand ?? null,
          Size: tyre.Size ?? null,
          Pattern: tyre.Pattern ?? null,
          LL_SR: tyre.LL_SR ?? null,
          PR: tyre.PR ?? null,
          SideWall: tyre.SideWall ?? null,
        },
      ]
    })
  }

  return (
    <AppModal isOpen={isOpen} title="Assign Tyres" onClose={onClose}>
      {loading ? <p className="hero-text">Loading tyres...</p> : null}
      {error ? <p className="hero-text">{error}</p> : null}
      {validationError ? <p className="hero-text">{validationError}</p> : null}

      {!loading && !error && availableTyres.length === 0 ? (
        <p className="table-empty">No tyres found.</p>
      ) : null}

      {!loading && availableTyres.length > 0 ? (
        <div className="supplier-tyre-options">
          {availableTyres.map((tyre) => {
            const selectedTyre = draftTyresById.get(tyre.Id)
            const isSelected = Boolean(selectedTyre)

            return (
              <label
                key={tyre.Id}
                className={`supplier-tyre-option ${isSelected ? "supplier-tyre-option-selected" : ""}`}
              >
                <div className="supplier-tyre-option-main">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTyre(tyre)}
                  />
                  <span title={formatTyreLabel(tyre, { preset: "full", showId: true })}>
                    {formatTyreLabel(tyre, { preset: "full", showId: true })}
                  </span>
                </div>
                {isSelected ? (
                  <input
                    className="text-input supplier-tyre-price-input"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Enter price"
                    value={selectedTyre?.Price ?? ""}
                    onChange={(event) => updatePrice(tyre.Id, event.target.value)}
                  />
                ) : null}
              </label>
            )
          })}
        </div>
      ) : null}

      <div className="header-actions contractor-tyre-modal-actions">
        <button className="secondary-action" type="button" onClick={onClose}>
          Cancel
        </button>
        <button
          className="secondary-action"
          type="button"
          onClick={() => setIsCreateTyreOpen(true)}
          disabled={loading}
        >
          Add New Tyre
        </button>
        <button
          className="primary-action"
          type="button"
          onClick={handleApply}
          disabled={loading}
        >
          Apply
        </button>
      </div>

      <CreateTyreDialog
        isOpen={isCreateTyreOpen}
        onClose={() => setIsCreateTyreOpen(false)}
        onCreated={handleTyreCreated}
        hideSupplier={true}
      />
    </AppModal>
  )
}
