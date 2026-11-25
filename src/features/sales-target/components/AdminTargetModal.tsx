import React, { useEffect, useState } from "react"
import { AppModal } from "../../../shared/ui/modal/AppModal"
import type {
  PeriodType,
  SalesRepUser,
  SalesTargetPayload,
  SalesTargetRecord,
  SalesTargetUpdatePayload,
  TargetCategory,
} from "../models/salesTarget"

interface AdminTargetModalProps {
  isOpen: boolean
  onClose: () => void
  editingTarget: SalesTargetRecord | null
  salesReps: SalesRepUser[]
  onSave: (payload: SalesTargetPayload | { id: number; data: SalesTargetUpdatePayload }) => Promise<void>
}

function formatLocalDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function calculateDefaultDates(period: PeriodType, refDate = new Date()): { start: string; end: string } {
  const d = new Date(refDate)
  switch (period) {
    case "daily": {
      const today = formatLocalDate(d)
      return { start: today, end: today }
    }
    case "weekly": {
      const day = d.getDay()
      const diffToMon = (day === 0 ? -6 : 1) - day
      const monday = new Date(d)
      monday.setDate(d.getDate() + diffToMon)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return { start: formatLocalDate(monday), end: formatLocalDate(sunday) }
    }
    case "monthly": {
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      return { start: formatLocalDate(start), end: formatLocalDate(end) }
    }
    case "annually": {
      const start = `${d.getFullYear()}-01-01`
      const end = `${d.getFullYear()}-12-31`
      return { start, end }
    }
  }
}

export function AdminTargetModal({
  isOpen,
  onClose,
  editingTarget,
  salesReps,
  onSave,
}: AdminTargetModalProps) {
  const isEdit = Boolean(editingTarget)

  const [salesRepId, setSalesRepId] = useState<number>(0)
  const [periodType, setPeriodType] = useState<PeriodType>("monthly")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [targetAmount, setTargetAmount] = useState<string>("")
  const [targetQty, setTargetQty] = useState<string>("")
  const [category, setCategory] = useState<TargetCategory>("all")
  const [notes, setNotes] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<boolean>(false)

  // Reset or populate fields when modal opens
  useEffect(() => {
    if (!isOpen) return

    setError(null)
    setSaving(false)

    if (editingTarget) {
      setSalesRepId(editingTarget.SalesRepID)
      setPeriodType(editingTarget.PeriodType)
      setStartDate(editingTarget.StartDate)
      setEndDate(editingTarget.EndDate)
      setTargetAmount(String(editingTarget.TargetAmount))
      setTargetQty(editingTarget.TargetQty != null ? String(editingTarget.TargetQty) : "")
      setCategory(editingTarget.Category)
      setNotes(editingTarget.Notes ?? "")
    } else {
      const defaultRep = salesReps[0]?.id || 0
      setSalesRepId(defaultRep)
      setPeriodType("monthly")
      const defaults = calculateDefaultDates("monthly")
      setStartDate(defaults.start)
      setEndDate(defaults.end)
      setTargetAmount("")
      setTargetQty("")
      setCategory("all")
      setNotes("")
    }
  }, [isOpen, editingTarget, salesReps])

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriodType(newPeriod)
    if (!isEdit) {
      const defaults = calculateDefaultDates(newPeriod)
      setStartDate(defaults.start)
      setEndDate(defaults.end)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isEdit && (!salesRepId || salesRepId <= 0)) {
      setError("Please select a valid sales representative.")
      return
    }

    const amountNum = parseFloat(targetAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid target amount greater than zero.")
      return
    }

    if (!startDate || !endDate) {
      setError("Please specify both start date and end date.")
      return
    }

    if (startDate > endDate) {
      setError("Start date cannot be after end date.")
      return
    }

    const qtyNum = targetQty.trim() !== "" ? parseInt(targetQty, 10) : null
    if (qtyNum !== null && (isNaN(qtyNum) || qtyNum < 0)) {
      setError("Target quantity must be zero or a positive whole number.")
      return
    }

    setSaving(true)
    try {
      if (isEdit && editingTarget) {
        await onSave({
          id: editingTarget.TargetID,
          data: {
            StartDate: startDate,
            EndDate: endDate,
            TargetAmount: amountNum,
            TargetQty: qtyNum,
            Category: category,
            Notes: notes.trim() || null,
          },
        })
      } else {
        await onSave({
          SalesRepID: salesRepId,
          PeriodType: periodType,
          StartDate: startDate,
          EndDate: endDate,
          TargetAmount: amountNum,
          TargetQty: qtyNum,
          Category: category,
          Notes: notes.trim() || null,
        })
      }
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save sales target"
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Target #${editingTarget?.TargetID}` : "Assign New Sales Target"}
    >
      <form onSubmit={handleSubmit} className="target-form">
        {error && (
          <div className="target-form-error">
            {error}
          </div>
        )}

        {/* Sales Representative */}
        <div className="target-form-group">
          <label htmlFor="target-rep" className="target-form-label">
            Sales Representative *
          </label>
          {isEdit ? (
            <input
              type="text"
              className="input target-form-input-disabled"
              value={`${editingTarget?.SalesRepName || editingTarget?.SalesRepUsername} (#${editingTarget?.SalesRepID})`}
              disabled
            />
          ) : (
            <select
              id="target-rep"
              className="input select target-form-input"
              value={salesRepId}
              onChange={(e) => setSalesRepId(Number(e.target.value))}
              required
            >
              <option value={0} disabled>
                -- Select Sales Representative --
              </option>
              {salesReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.displayName || rep.username} ({rep.roleName || "Sales Rep"})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Period & Category Row */}
        <div className="target-form-row">
          <div className="target-form-group">
            <label htmlFor="target-period" className="target-form-label">
              Period Cadence *
            </label>
            <select
              id="target-period"
              className="input select target-form-input"
              value={periodType}
              onChange={(e) => handlePeriodChange(e.target.value as PeriodType)}
              disabled={isEdit}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="annually">Annually</option>
            </select>
          </div>

          <div className="target-form-group">
            <label htmlFor="target-category" className="target-form-label">
              Product Category *
            </label>
            <select
              id="target-category"
              className="input select target-form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value as TargetCategory)}
            >
              <option value="all">All Products</option>
              <option value="tyre">Tyres Only</option>
              <option value="battery">Batteries Only</option>
            </select>
          </div>
        </div>

        {/* Start & End Dates */}
        <div className="target-form-row">
          <div className="target-form-group">
            <label htmlFor="target-start-date" className="target-form-label">
              Start Date *
            </label>
            <input
              id="target-start-date"
              type="date"
              className="input target-form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="target-form-group">
            <label htmlFor="target-end-date" className="target-form-label">
              End Date *
            </label>
            <input
              id="target-end-date"
              type="date"
              className="input target-form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Target Amount & Target Quantity */}
        <div className="target-form-row">
          <div className="target-form-group">
            <label htmlFor="target-amount" className="target-form-label">
              Target Revenue (LKR / Rs.) *
            </label>
            <input
              id="target-amount"
              type="number"
              step="any"
              min="1"
              className="input target-form-input"
              placeholder="e.g. 250000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </div>

          <div className="target-form-group">
            <label htmlFor="target-qty" className="target-form-label">
              Target Volume (Units, optional)
            </label>
            <input
              id="target-qty"
              type="number"
              min="0"
              step="1"
              className="input target-form-input"
              placeholder="e.g. 10"
              value={targetQty}
              onChange={(e) => setTargetQty(e.target.value)}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="target-form-group">
          <label htmlFor="target-notes" className="target-form-label">
            Notes & Directives (Optional)
          </label>
          <textarea
            id="target-notes"
            className="input textarea target-form-textarea"
            rows={2}
            placeholder="e.g. Focus on premium truck tyres and commercial accounts this month"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Modal Footer Actions */}
        <div className="target-form-actions">
          <button
            type="button"
            className="secondary-action"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="primary-action"
            disabled={saving}
          >
            {saving ? "Saving…" : isEdit ? "Update Target" : "Assign Target"}
          </button>
        </div>
      </form>
    </AppModal>
  )
}
