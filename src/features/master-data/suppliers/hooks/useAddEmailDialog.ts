import { useState } from "react"
import type { SupplierEmail } from "../models/supplier"
import { sanitizeEmailInput, validateEmail } from "../../../../shared/validation/email"

interface UseAddEmailDialogProps {
  onAdd: (emails: SupplierEmail[]) => void
  onClose: () => void
}

export function useAddEmailDialog({ onAdd, onClose }: UseAddEmailDialogProps) {
  const [currentEmail, setCurrentEmail] = useState("")
  const [pendingEmails, setPendingEmails] = useState<string[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleEmailChange = (value: string) => {
    const sanitized = sanitizeEmailInput(value)
    setCurrentEmail(sanitized)
    setValidationError(sanitized ? validateEmail(sanitized) : null)
  }

  const handleAddToPendingList = () => {
    const trimmedEmail = currentEmail.trim()
    if (!trimmedEmail) return

    const error = validateEmail(trimmedEmail)
    if (error) {
      setValidationError(error)
      return
    }

    if (!pendingEmails.includes(trimmedEmail)) {
      setPendingEmails((prev) => [...prev, trimmedEmail])
      setCurrentEmail("")
      setValidationError(null)
    }
  }

  const handleRemoveFromPendingList = (emailToRemove: string) => {
    setPendingEmails((prev) => prev.filter((email) => email !== emailToRemove))
  }

  const handleAddEmails = () => {
    const trimmedCurrentEmail = currentEmail.trim()

    if (trimmedCurrentEmail && validateEmail(trimmedCurrentEmail)) {
      setValidationError(validateEmail(trimmedCurrentEmail))
      return
    }

    let emailsToSubmit = [...pendingEmails]

    if (trimmedCurrentEmail && !pendingEmails.includes(trimmedCurrentEmail)) {
      emailsToSubmit = [...emailsToSubmit, trimmedCurrentEmail]
    }

    if (emailsToSubmit.length === 0) return

    const newEmails: SupplierEmail[] = emailsToSubmit.map((email) => ({
      EmailAddress: email,
      IsPrimary: 0,
    }))

    onAdd(newEmails)
    handleCloseAndReset()
  }

  const handleCloseAndReset = () => {
    setPendingEmails([])
    setCurrentEmail("")
    setValidationError(null)
    onClose()
  }

  return {
    currentEmail,
    setCurrentEmail: handleEmailChange,
    pendingEmails,
    validationError,
    handleAddToPendingList,
    handleRemoveFromPendingList,
    handleAddEmails,
    handleCloseAndReset,
  }
}
