import { useState } from "react"
import type { BranchAddress } from "../models/branch"

interface UseAddAddressDialogProps {
  initialAddress?: BranchAddress | null
  onSave: (address: BranchAddress) => void
  onClose: () => void
}

export function useAddAddressDialog({
  initialAddress,
  onSave,
  onClose,
}: UseAddAddressDialogProps) {
  const [currentAddressInput, setCurrentAddressInput] = useState<Partial<BranchAddress>>({
    AddressLine1: initialAddress?.AddressLine1 ?? "",
    AddressLine2: initialAddress?.AddressLine2 ?? "",
    City: initialAddress?.City ?? "",
    State: initialAddress?.State ?? "",
    PostalCode: initialAddress?.PostalCode ?? "",
  })

  const isAddressValid =
    Boolean(currentAddressInput.AddressLine1?.trim()) &&
    Boolean(currentAddressInput.City?.trim())

  const updateCurrentAddressField = (field: keyof BranchAddress, value: string) => {
    setCurrentAddressInput((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    if (!isAddressValid) {
      return
    }

    onSave({
      AddressLine1: currentAddressInput.AddressLine1 ?? "",
      AddressLine2: currentAddressInput.AddressLine2 ?? "",
      City: currentAddressInput.City ?? "",
      State: currentAddressInput.State ?? "",
      PostalCode: currentAddressInput.PostalCode ?? "",
    })

    handleCloseAndReset()
  }

  const handleCloseAndReset = () => {
    setCurrentAddressInput({
      AddressLine1: "",
      AddressLine2: "",
      City: "",
      State: "",
      PostalCode: "",
    })
    onClose()
  }

  return {
    currentAddressInput,
    updateCurrentAddressField,
    isAddressValid,
    handleSave,
    handleCloseAndReset,
  }
}
