import { useCallback, useEffect, useState, type FormEvent } from "react"
import type { TyreRecord } from "../../tyres/models/tyre"
import { tyreService } from "../../tyres/services/tyreService"
import type { ContractorPayload, ContractorRecord } from "../models/contractor"
import { contractorService } from "../services/contractorService"

const initialFormState: ContractorPayload = {
  Name: "",
  Rating: null,
  Contacts: [],
  Emails: [],
  Addresses: [],
  TyreIDs: [],
}

type UseContractorFormOptions = {
  contractorId?: number
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function useContractorForm(options?: UseContractorFormOptions) {
  const contractorId = options?.contractorId
  const onSuccess = options?.onSuccess
  const onError = options?.onError
  const [formData, setFormData] = useState<ContractorPayload>(initialFormState)
  const [availableTyres, setAvailableTyres] = useState<TyreRecord[]>([])
  const [tyresLoading, setTyresLoading] = useState(false)
  const [tyresError, setTyresError] = useState<string | null>(null)
  const [hasLoadedTyres, setHasLoadedTyres] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setFormData(initialFormState)
    setError(null)
    setInitializing(false)
  }, [])

  const fetchTyres = useCallback(async () => {
    setTyresLoading(true)
    setTyresError(null)

    try {
      const tyres = await tyreService.getTyres()
      setAvailableTyres(tyres)
      setHasLoadedTyres(true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load tyres"
      setTyresError(message)
      onError?.(message)
    } finally {
      setTyresLoading(false)
    }
  }, [onError])

  const loadTyresOnDemand = useCallback(async () => {
    if (hasLoadedTyres) {
      return
    }

    await fetchTyres()
  }, [hasLoadedTyres, fetchTyres])

  const reloadTyres = useCallback(async () => {
    await fetchTyres()
  }, [fetchTyres])

  const loadContractor = useCallback(
    async (currentContractorId: number, isActive: () => boolean) => {
      setInitializing(true)
      setError(null)

      try {
        const contractor = await contractorService.getContractorById(currentContractorId)

        if (!isActive()) {
          return
        }

        setFormData(toFormState(contractor))
      } catch (err) {
        if (!isActive()) {
          return
        }

        const message =
          err instanceof Error ? err.message : "Failed to load contractor"
        setError(message)
        onError?.(message)
      } finally {
        if (isActive()) {
          setInitializing(false)
        }
      }
    },
    [onError]
  )

  useEffect(() => {
    if (!contractorId) {
      resetForm()
      return
    }

    let active = true
    void loadContractor(contractorId, () => active)
    void fetchTyres()

    return () => {
      active = false
    }
  }, [contractorId, loadContractor, resetForm, fetchTyres])

  function updateField<K extends keyof ContractorPayload>(
    field: K,
    value: ContractorPayload[K],
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload: ContractorPayload = {
      Name: formData.Name.trim(),
      Rating: normalizeInteger(formData.Rating),
      Contacts: formData.Contacts,
      Emails: formData.Emails,
      Addresses: formData.Addresses,
      TyreIDs: formData.TyreIDs ?? [],
    }

    try {
      if (contractorId) {
        await contractorService.updateContractor(contractorId, payload)
      } else {
        await contractorService.createContractor(payload)
      }
      onSuccess?.()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : contractorId
            ? "Failed to update contractor"
            : "Failed to create contractor"
      setError(message)
      onError?.(message)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    formData,
    availableTyres,
    tyresLoading,
    tyresError,
    submitting,
    initializing,
    error,
    updateField,
    handleSubmit,
    loadTyresOnDemand,
    reloadTyres,
  }
}

function normalizeInteger(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = Number(value)

  if (!Number.isFinite(normalized)) {
    return null
  }

  return Math.trunc(normalized)
}

function toFormState(contractor: ContractorRecord): ContractorPayload {
  return {
    Name: contractor.Name,
    Rating: contractor.Rating ?? null,
    Contacts: contractor.Contacts ?? [],
    Emails: contractor.Emails ?? [],
    Addresses: contractor.Addresses ?? [],
    TyreIDs: contractor.TyreIDs?.length
      ? contractor.TyreIDs
      : (contractor.Tyres ?? []).map((tyre) => tyre.Id),
  }
}
