import { useState } from "react"
import type { ContractorAddress } from "../models/contractor"

const emptyAddressInput: Partial<ContractorAddress> = {
  AddressType: "Billing",
  AddressLine1: "",
  AddressLine2: "",
  City: "",
  State: "",
  PostalCode: "",
}

interface UseAddAddressDialogProps {
  onAdd: (addresses: ContractorAddress[]) => void
  onClose: () => void
}

export function useAddAddressDialog({ onAdd, onClose }: UseAddAddressDialogProps) {
  const [currentAddressInput, setCurrentAddressInput] = useState<Partial<ContractorAddress>>(emptyAddressInput)
  const [pendingAddresses, setPendingAddresses] = useState<ContractorAddress[]>([])

  const updateCurrentAddressField = (field: keyof ContractorAddress, value: string | number | boolean) => {
    setCurrentAddressInput((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddToPendingList = () => {
    if (!currentAddressInput.AddressLine1?.trim() || !currentAddressInput.City?.trim()) {
      return
    }

    const newAddress: ContractorAddress = {
      ...currentAddressInput as ContractorAddress,
      IsPrimary: 0,
    }

    const isDuplicate = pendingAddresses.some(
      (addr) => JSON.stringify(addr) === JSON.stringify(newAddress)
    )

    if (!isDuplicate) {
      setPendingAddresses((prev) => [...prev, newAddress])
      setCurrentAddressInput(emptyAddressInput)
    }
  }

  const handleRemoveFromPendingList = (addressToRemove: ContractorAddress) => {
    setPendingAddresses((prev) => prev.filter((addr) => JSON.stringify(addr) !== JSON.stringify(addressToRemove)))
  }

  const handleAddAddresses = () => {
    let addressesToSubmit = [...pendingAddresses]

    if (currentAddressInput.AddressLine1?.trim() && currentAddressInput.City?.trim()) {
      const newAddress: ContractorAddress = { ...currentAddressInput as ContractorAddress, IsPrimary: 0 }
      const isDuplicate = addressesToSubmit.some((addr) => JSON.stringify(addr) === JSON.stringify(newAddress))
      if (!isDuplicate) {
        addressesToSubmit = [...addressesToSubmit, newAddress]
      }
    }

    if (addressesToSubmit.length === 0) return

    onAdd(addressesToSubmit)
    handleCloseAndReset()
  }

  const handleCloseAndReset = () => {
    setPendingAddresses([])
    setCurrentAddressInput(emptyAddressInput)
    onClose()
  }

  return {
    currentAddressInput,
    updateCurrentAddressField,
    pendingAddresses,
    handleAddToPendingList,
    handleRemoveFromPendingList,
    handleAddAddresses,
    handleCloseAndReset,
  }
}
