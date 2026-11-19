import { useCallback, useEffect, useState, type FormEvent } from "react"
import { AppModal } from "../../../shared/ui/modal/AppModal"
import type { DeliveryDateDialogMode } from "../hooks/useDagDetailsActions"
import type { DagRecord } from "../models/dag"

type DeliveryDateDialogProps = {
  isOpen: boolean
  mode: DeliveryDateDialogMode
  dag: DagRecord | null
  defaultDeliveryDate?: string | null
  onClose: () => void
  onSubmit: (deliveryDate: string) => Promise<void>
}

// Local wall-clock date in the YYYY-MM-DD shape the service validates, computed
// in JS so it cannot drift with the SQLite/Node timezone.
const todayIso = () => {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, "0")

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function DeliveryDateDialog({
  isOpen,
  mode,
  dag,
  defaultDeliveryDate,
  onClose,
  onSubmit,
}: DeliveryDateDialogProps) {
  const [deliveryDate, setDeliveryDate] = useState(defaultDeliveryDate ?? todayIso())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = mode === "edit"

  // Reset on open so a dismissed attempt cannot leak its date or error in.
  useEffect(() => {
    if (isOpen) {
      setDeliveryDate(defaultDeliveryDate ?? todayIso())
      setError(null)
    }
  }, [isOpen, defaultDeliveryDate])

  const handleClose = useCallback(() => {
    setError(null)
    onClose()
  }, [onClose])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!dag) {
        return
      }

      if (!deliveryDate) {
        setError("A delivery date is required")
        return
      }

      setSubmitting(true)
      setError(null)

      try {
        await onSubmit(deliveryDate)
        handleClose()
      } catch (err) {
        const fallback = isEdit
          ? "Failed to update the delivery date"
          : "Failed to set the delivery date"
        const message = err instanceof Error ? err.message : fallback
        setError(message)
      } finally {
        setSubmitting(false)
      }
    },
    [dag, deliveryDate, onSubmit, handleClose, isEdit],
  )

  if (!dag) {
    return null
  }

  return (
    <AppModal
      isOpen={isOpen}
      title={`${isEdit ? "Update" : "Set"} Delivery Date: DAG #${dag.ID}`}
      onClose={handleClose}
    >
      <p className="hero-text modal-hint-text">
        {isEdit
          ? "Change the delivery date recorded for this DAG."
          : "Recording the delivery date moves this DAG to Arriving."}
      </p>

      {error && <p className="hero-text error-text modal-hint-text">{error}</p>}

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="field-label">
          Delivery date
          <input
            className="text-input"
            type="date"
            value={deliveryDate}
            onChange={(event) => setDeliveryDate(event.target.value)}
          />
        </label>

        <div className="header-actions">
          <button
            className="secondary-action"
            type="button"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="primary-action"
            type="submit"
            disabled={submitting || !deliveryDate}
          >
            {submitting ? "Saving..." : isEdit ? "Update Delivery Date" : "Set Delivery Date"}
          </button>
        </div>
      </form>
    </AppModal>
  )
}
