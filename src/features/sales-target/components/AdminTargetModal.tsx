import React, { useEffect, useState } from "react"
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  Layers,
  Plus,
  RotateCw,
  Target,
  User,
} from "lucide-react"
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

function calculateDurationDays(start: string, end: string): number | null {
  if (!start || !end) return null
  const s = new Date(start + "T00:00:00")
  const e = new Date(end + "T00:00:00")
  const diffTime = e.getTime() - s.getTime()
  if (isNaN(diffTime) || diffTime < 0) return null
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1
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

  const durationDays = calculateDurationDays(startDate, endDate)

  const formattedRevenuePreview = (() => {
    const num = parseFloat(targetAmount)
    if (isNaN(num) || num <= 0) return null
    return (
      "Rs. " +
      num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    )
  })()

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
        <div className="target-modal-intro">
          <p className="target-modal-subtitle">
            {isEdit
              ? "Adjust quota targets, validity dates, or directives for this representative."
              : "Define dynamic revenue quotas and optional volume targets. Attainment is tracked in real-time."}
          </p>
        </div>

        {error && (
          <div className="target-modal-error-banner" role="alert">
            <AlertCircle size={18} className="target-error-icon" />
            <span className="target-error-text">{error}</span>
          </div>
        )}

        {/* Sales Representative */}
        <div className="target-form-group">
          <label htmlFor="target-rep" className="target-form-label">
            <span>Sales Representative</span>
            <span className="target-field-required">*</span>
          </label>
          <div className="target-modal-input-wrap">
            <User size={16} className="target-modal-input-icon" />
            {isEdit ? (
              <input
                type="text"
                className="target-modal-input target-modal-input-disabled"
                value={`${editingTarget?.SalesRepName || editingTarget?.SalesRepUsername} (#${editingTarget?.SalesRepID})`}
                disabled
              />
            ) : (
              <>
                <select
                  id="target-rep"
                  className="target-modal-select"
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
                <ChevronDown size={15} className="target-modal-chevron" />
              </>
            )}
          </div>
        </div>

        {/* Period & Category Row */}
        <div className="target-form-row">
          <div className="target-form-group">
            <label htmlFor="target-period" className="target-form-label">
              <span>Period Cadence</span>
              <span className="target-field-required">*</span>
            </label>
            <div className="target-modal-input-wrap">
              <Calendar size={16} className="target-modal-input-icon" />
              <select
                id="target-period"
                className="target-modal-select"
                value={periodType}
                onChange={(e) => handlePeriodChange(e.target.value as PeriodType)}
                disabled={isEdit}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
              </select>
              {!isEdit && <ChevronDown size={15} className="target-modal-chevron" />}
            </div>
          </div>

          <div className="target-form-group">
            <label htmlFor="target-category" className="target-form-label">
              <span>Product Category</span>
              <span className="target-field-required">*</span>
            </label>
            <div className="target-modal-input-wrap">
              <Layers size={16} className="target-modal-input-icon" />
              <select
                id="target-category"
                className="target-modal-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as TargetCategory)}
              >
                <option value="all">All Products</option>
                <option value="tyre">Tyres Only</option>
                <option value="battery">Batteries Only</option>
              </select>
              <ChevronDown size={15} className="target-modal-chevron" />
            </div>
          </div>
        </div>

        {/* Start & End Dates */}
        <div className="target-form-row">
          <div className="target-form-group">
            <div className="target-label-with-meta">
              <label htmlFor="target-start-date" className="target-form-label">
                <span>Start Date</span>
                <span className="target-field-required">*</span>
              </label>
            </div>
            <div className="target-modal-input-wrap">
              <Calendar size={16} className="target-modal-input-icon" />
              <input
                id="target-start-date"
                type="date"
                className="target-modal-input target-modal-date-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="target-form-group">
            <div className="target-label-with-meta">
              <label htmlFor="target-end-date" className="target-form-label">
                <span>End Date</span>
                <span className="target-field-required">*</span>
              </label>
              {durationDays !== null && (
                <span className="target-duration-badge" title="Total target period duration">
                  {durationDays} {durationDays === 1 ? "day" : "days"}
                </span>
              )}
            </div>
            <div className="target-modal-input-wrap">
              <Calendar size={16} className="target-modal-input-icon" />
              <input
                id="target-end-date"
                type="date"
                className="target-modal-input target-modal-date-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Target Amount & Target Quantity */}
        <div className="target-form-row">
          <div className="target-form-group">
            <div className="target-label-with-meta">
              <label htmlFor="target-amount" className="target-form-label">
                <span>Target Revenue (LKR)</span>
                <span className="target-field-required">*</span>
              </label>
              {formattedRevenuePreview && (
                <span className="target-preview-badge" title="Formatted target revenue">
                  {formattedRevenuePreview}
                </span>
              )}
            </div>
            <div className="target-modal-input-wrap">
              <span className="target-modal-prefix">Rs.</span>
              <input
                id="target-amount"
                type="number"
                step="any"
                min="1"
                className="target-modal-input target-modal-input-with-prefix"
                placeholder="e.g. 250000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="target-form-group">
            <div className="target-label-with-meta">
              <label htmlFor="target-qty" className="target-form-label">
                <span>Target Volume</span>
                <span className="target-field-optional">(Optional)</span>
              </label>
              {targetQty && !isNaN(Number(targetQty)) && Number(targetQty) > 0 && (
                <span className="target-preview-badge">
                  {Number(targetQty).toLocaleString()} units
                </span>
              )}
            </div>
            <div className="target-modal-input-wrap">
              <Target size={16} className="target-modal-input-icon" />
              <input
                id="target-qty"
                type="number"
                min="0"
                step="1"
                className="target-modal-input"
                placeholder="e.g. 10"
                value={targetQty}
                onChange={(e) => setTargetQty(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="target-form-group">
          <label htmlFor="target-notes" className="target-form-label">
            <span>Notes & Directives</span>
            <span className="target-field-optional">(Optional)</span>
          </label>
          <div className="target-modal-textarea-wrap">
            <textarea
              id="target-notes"
              className="target-modal-textarea"
              rows={3}
              placeholder="e.g. Focus on premium truck tyres and commercial fleet accounts this month"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="target-form-actions">
          <button
            type="button"
            className="target-modal-cancel-btn"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="target-modal-submit-btn"
            disabled={saving}
          >
            {saving ? (
              <>
                <RotateCw size={15} className="target-spin-icon" />
                <span>Saving…</span>
              </>
            ) : isEdit ? (
              <>
                <Check size={16} strokeWidth={2.2} />
                <span>Update Target</span>
              </>
            ) : (
              <>
                <Plus size={16} strokeWidth={2.2} />
                <span>Assign Target</span>
              </>
            )}
          </button>
        </div>
      </form>
    </AppModal>
  )
}
