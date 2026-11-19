import { useMemo, useState } from "react"
import { AppModal } from "../../../../shared/ui/modal/AppModal"
import { formatTyreLabel } from "../../../../shared/tyre/models/tyreDisplay"
import { CreateTyreDialog } from "../../tyres/components/CreateTyreDialog"
import type { TyreRecord } from "../../tyres/models/tyre"

type TyrePickerModalProps = {
  isOpen: boolean
  selectedTyreIds: number[]
  availableTyres: TyreRecord[]
  loading?: boolean
  error?: string | null
  onApply: (tyreIds: number[]) => void
  onClose: () => void
  onTyreCreated?: (tyre: TyreRecord) => void
}

export function TyrePickerModal({
  isOpen,
  selectedTyreIds,
  availableTyres,
  loading = false,
  error = null,
  onApply,
  onClose,
  onTyreCreated,
}: TyrePickerModalProps) {
  const [draftSelectedTyreIds, setDraftSelectedTyreIds] = useState<number[]>(selectedTyreIds)
  const [isCreateTyreOpen, setIsCreateTyreOpen] = useState(false)

  const draftTyreIdSet = useMemo(
    () => new Set(draftSelectedTyreIds),
    [draftSelectedTyreIds],
  )

  const toggleTyre = (tyreId: number) => {
    setDraftSelectedTyreIds((current) =>
      current.includes(tyreId)
        ? current.filter((id) => id !== tyreId)
        : [...current, tyreId]
    )
  }

  const handleApply = () => {
    onApply(draftSelectedTyreIds)
    onClose()
  }

  const handleTyreCreated = (tyre: TyreRecord) => {
    onTyreCreated?.(tyre)
    setDraftSelectedTyreIds((current) =>
      current.includes(tyre.Id) ? current : [...current, tyre.Id],
    )
  }

  return (
    <AppModal isOpen={isOpen} title="Select Tyres" onClose={onClose}>
      {loading ? <p className="hero-text">Loading tyres...</p> : null}
      {error ? <p className="hero-text">{error}</p> : null}

      {!loading && !error && availableTyres.length === 0 ? (
        <p className="table-empty">No tyres found.</p>
      ) : null}

      {!loading && availableTyres.length > 0 ? (
        <div className="contractor-tyre-options">
          {availableTyres.map((tyre) => (
            <label
              key={tyre.Id}
              className={`contractor-tyre-option ${draftTyreIdSet.has(tyre.Id) ? "contractor-tyre-option-selected" : ""}`}
            >
              <input
                type="checkbox"
                checked={draftTyreIdSet.has(tyre.Id)}
                onChange={() => toggleTyre(tyre.Id)}
              />
              <span title={formatTyreLabel(tyre, { preset: "full", showId: true })}>
                {formatTyreLabel(tyre, { preset: "full", showId: true })}
              </span>
            </label>
          ))}
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
      />
    </AppModal>
  )
}
