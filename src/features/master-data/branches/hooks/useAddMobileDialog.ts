import { useState } from "react"
import type { BranchContact } from "../models/branch"
import { sanitizePhoneInput, validatePhone } from "../../../../shared/validation/phone"

interface UseAddMobileDialogProps {
  onAdd: (contacts: BranchContact[]) => void
  onClose: () => void
}

export function useAddMobileDialog({ onAdd, onClose }: UseAddMobileDialogProps) {
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState("")
  const [pendingMobileNumbers, setPendingMobileNumbers] = useState<string[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)

  const handlePhoneNumberChange = (value: string) => {
    const sanitized = sanitizePhoneInput(value)
    setCurrentPhoneNumber(sanitized)
    setValidationError(sanitized ? validatePhone(sanitized) : null)
  }

  const handleAddToPendingList = () => {
    const trimmedNumber = currentPhoneNumber.trim()
    if (!trimmedNumber) return

    const error = validatePhone(trimmedNumber)
    if (error) {
      setValidationError(error)
      return
    }

    if (!pendingMobileNumbers.includes(trimmedNumber)) {
      setPendingMobileNumbers((prev) => [...prev, trimmedNumber])
      setCurrentPhoneNumber("")
      setValidationError(null)
    }
  }

  const handleRemoveFromPendingList = (numberToRemove: string) => {
    setPendingMobileNumbers((prev) => prev.filter((num) => num !== numberToRemove))
  }

  const handleAddNumbers = () => {
    const trimmedCurrentNumber = currentPhoneNumber.trim()

    if (trimmedCurrentNumber) {
      const error = validatePhone(trimmedCurrentNumber)
      if (error) {
        setValidationError(error)
        return
      }
    }

    let numbersToSubmit = [...pendingMobileNumbers]

    if (trimmedCurrentNumber && !pendingMobileNumbers.includes(trimmedCurrentNumber)) {
      numbersToSubmit = [...numbersToSubmit, trimmedCurrentNumber]
    }

    if (numbersToSubmit.length === 0) return

    const newContacts: BranchContact[] = numbersToSubmit.map((num) => ({
      PhoneNumber: num,
      IsPrimary: 0,
    }))

    onAdd(newContacts)

    setPendingMobileNumbers([])
    setCurrentPhoneNumber("")
    setValidationError(null)
    onClose()
  }

  const handleCloseAndReset = () => {
    setPendingMobileNumbers([])
    setCurrentPhoneNumber("")
    setValidationError(null)
    onClose()
  }

  return {
    currentPhoneNumber,
    setCurrentPhoneNumber: handlePhoneNumberChange,
    pendingMobileNumbers,
    validationError,
    handleAddToPendingList,
    handleRemoveFromPendingList,
    handleAddNumbers,
    handleCloseAndReset,
  }
}
