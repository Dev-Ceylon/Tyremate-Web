import { useState, useEffect, useCallback, type FormEvent } from "react"
import { dagService } from "../services/dagService"
import type { DagContractorApprovalRecord, DagRecord } from "../models/dag"

type UseIssueGatePassOptions = {
  isOpen: boolean
  dag: DagRecord | null
  onSubmit: (dag: DagRecord) => Promise<void>
  onClose: () => void
}

const describeDecision = (status: DagContractorApprovalRecord["ApprovalStatus"]) => {
  if (status === "approved") return "Approved"
  if (status === "rejected") return "Rejected"
  return "Pending"
}

// Mirrors the backend gate in dagService.issueGatePass: the latest allocation
// must be approved. Surfaced here so the dialog explains why Confirm is
// disabled instead of silently blocking the user.
export function useIssueGatePass({ isOpen, dag, onSubmit, onClose }: UseIssueGatePassOptions) {
  const [allocation, setAllocation] = useState<DagContractorApprovalRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Read the allocation when the dialog opens so the dialog can name the
  // contractor being issued against. The backend re-derives this, so this is
  // for display and for pre-empting a pointless round trip.
  useEffect(() => {
    if (!isOpen || !dag) {
      return
    }

    const fetchAllocation = async () => {
      setLoading(true)
      setError(null)
      try {
        const approvals = await dagService.getContractorApprovals(dag.ID)
        setAllocation(approvals[0] ?? null)
      } catch (err) {
        setAllocation(null)
        setError(err instanceof Error ? err.message : "Failed to load the contractor assignment")
      } finally {
        setLoading(false)
      }
    }

    void fetchAllocation()
  }, [isOpen, dag])

  const handleClose = useCallback(() => {
    setAllocation(null)
    setError(null)
    onClose()
  }, [onClose])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!dag) {
        return
      }

      setSubmitting(true)
      setError(null)

      try {
        await onSubmit(dag)
        handleClose()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to issue gate pass"
        setError(message)
      } finally {
        setSubmitting(false)
      }
    },
    [dag, onSubmit, handleClose],
  )

  return {
    allocation,
    describeDecision,
    loading,
    submitting,
    error,
    handleClose,
    handleSubmit,
  }
}