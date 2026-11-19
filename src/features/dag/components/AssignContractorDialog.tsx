import { AppModal } from "../../../shared/ui/modal/AppModal"
import { useAssignContractor, type AssignContractorForm } from "../hooks/useAssignContractor"

type AssignContractorDialogProps = {
  isOpen: boolean
  dagId: number
  initialContractorId: number | null
  onClose: () => void
  onSubmit: (form: AssignContractorForm) => Promise<void>
}

export function AssignContractorDialog({
  isOpen,
  dagId,
  initialContractorId,
  onClose,
  onSubmit,
}: AssignContractorDialogProps) {
  const {
    contractors,
    form,
    loadingContractors,
    submitting,
    error,
    updateField,
    handleClose,
    handleSubmit,
  } = useAssignContractor({ isOpen, initialContractorId, onSubmit, onClose })

  const isReassignment = initialContractorId !== null

  return (
    <AppModal
      isOpen={isOpen}
      title={`${isReassignment ? "Reassign" : "Assign"} Contractor: DAG #${dagId}`}
      onClose={handleClose}
    >
      <p className="hero-text modal-hint-text">
        {isReassignment
          ? "Reassigning keeps the previous approval in the history below."
          : "Select a contractor. The assignment is created pending and can then be approved or rejected."}
      </p>

      {error && (
        <p className="hero-text error-text modal-hint-text">
          {error}
        </p>
      )}

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="field-label">
          Contractor
          <select
            className="text-input"
            value={form.ContractorID ?? ""}
            onChange={(e) => updateField("ContractorID", Number(e.target.value) || null)}
            disabled={loadingContractors || submitting}
            required
          >
            <option value="">
              {loadingContractors ? "Loading contractors..." : "Select Contractor"}
            </option>
            {contractors.map((contractor) => (
              <option key={contractor.ID} value={contractor.ID}>
                {contractor.Name}
              </option>
            ))}
          </select>
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
            disabled={submitting || loadingContractors || !form.ContractorID}
          >
            {submitting ? "Saving..." : isReassignment ? "Reassign Contractor" : "Assign Contractor"}
          </button>
        </div>
      </form>
    </AppModal>
  )
}