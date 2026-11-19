import { AppModal } from "../../../shared/ui/modal/AppModal"

type Props = {
  isOpen: boolean
  shortfall: number
  settledAmount: number
  requiredCoverage: number
  submitting?: boolean
  onIssueAnyway: () => void
  onKeepWithheld: () => void
}

const formatMoney = (value: number) =>
  `LKR ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function GatePassPaymentOverrideModal({
  isOpen,
  shortfall,
  settledAmount,
  requiredCoverage,
  submitting = false,
  onIssueAnyway,
  onKeepWithheld,
}: Props) {
  return (
    <AppModal
      isOpen={isOpen}
      title="Payment is incomplete"
      onClose={() => {
        if (!submitting) onKeepWithheld()
      }}
    >
      <div className="gate-pass-override-modal">
        <p>
          Settled payments cover <strong>{formatMoney(settledAmount)}</strong> of the
          <strong> {formatMoney(requiredCoverage)}</strong> required for deliveries so far.
          <strong> {formatMoney(shortfall)}</strong> remains unpaid.
        </p>
        <p className="gate-pass-override-warning">
          Issuing a gate pass now will authorize release of the tyres despite the unpaid
          balance. This payment override will be recorded with the signed-in user and
          timestamp for monitoring.
        </p>
        <div className="gate-pass-override-actions">
          <button
            type="button"
            className="secondary-action"
            onClick={onKeepWithheld}
            disabled={submitting}
          >
            Keep gate pass withheld
          </button>
          <button
            type="button"
            className="danger-action"
            onClick={onIssueAnyway}
            disabled={submitting}
          >
            {submitting ? "Issuing..." : "Issue gate pass anyway"}
          </button>
        </div>
      </div>
    </AppModal>
  )
}
