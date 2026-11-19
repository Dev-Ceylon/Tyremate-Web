import { useState, useEffect, useCallback, type FormEvent } from "react"
import { contractorService } from "../../master-data/contractors/services/contractorService"
import type { ContractorRecord } from "../../master-data/contractors/models/contractor"

// Step 1 of 2 only: the contractor is allocated here and the approval decision
// is made separately via DagContractorCard, mirroring PO supplier allocation.
// Hence the form carries a single field.
export type AssignContractorForm = {
  ContractorID: number | null
}

type UseAssignContractorOptions = {
  isOpen: boolean
  initialContractorId: number | null
  onSubmit: (form: AssignContractorForm) => Promise<void>
  onClose: () => void
}

const emptyForm: AssignContractorForm = {
  ContractorID: null,
}

export function useAssignContractor({
  isOpen,
  initialContractorId,
  onSubmit,
  onClose,
}: UseAssignContractorOptions) {
  const [contractors, setContractors] = useState<ContractorRecord[]>([])
  const [form, setForm] = useState<AssignContractorForm>(emptyForm)
  const [loadingContractors, setLoadingContractors] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset and seed the contractor whenever the dialog opens so a reassignment
  // starts from the currently assigned contractor instead of a blank select.
  useEffect(() => {
    if (!isOpen) {
      return
    }

    setForm({ ...emptyForm, ContractorID: initialContractorId })
    setError(null)
  }, [isOpen, initialContractorId])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const fetchContractors = async () => {
      setLoadingContractors(true)
      setError(null)
      try {
        setContractors(await contractorService.getContractors())
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load contractors")
      } finally {
        setLoadingContractors(false)
      }
    }

    void fetchContractors()
  }, [isOpen])

  const updateField = useCallback(
    <K extends keyof AssignContractorForm>(field: K, value: AssignContractorForm[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  const handleClose = useCallback(() => {
    setForm(emptyForm)
    setError(null)
    onClose()
  }, [onClose])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!form.ContractorID) {
        setError("Select a contractor")
        return
      }

      setSubmitting(true)
      setError(null)

      try {
        await onSubmit({ ContractorID: form.ContractorID })
        handleClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to assign contractor")
      } finally {
        setSubmitting(false)
      }
    },
    [form, onSubmit, handleClose],
  )

  return {
    contractors,
    form,
    loadingContractors,
    submitting,
    error,
    updateField,
    handleClose,
    handleSubmit,
  }
}