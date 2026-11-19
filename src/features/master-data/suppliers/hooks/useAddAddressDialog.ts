import { useState } from "react"
import type { SupplierAddress } from "../models/supplier"

interface UseAddAddressDialogProps {
  onAdd: (addresses: SupplierAddress[]) => void
  onClose: () => void
}

const initialAddressInput = {
  AddressType: "Billing",
  AddressLine1: "",
  AddressLine2: "",
  City: "",
  State: "",
  PostalCode: "",
}

export function useAddAddressDialog({ onAdd, onClose }: UseAddAddressDialogProps) {
  const [currentAddressInput, setCurrentAddressInput] = useState<Partial<SupplierAddress>>(
    initialAddressInput
  )
  const [pendingAddresses, setPendingAddresses] = useState<SupplierAddress[]>([])

  const updateCurrentAddressField = (field: keyof SupplierAddress, value: string | number | boolean) => {
    setCurrentAddressInput((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddToPendingList = () => {
    if (!currentAddressInput.AddressLine1?.trim() || !currentAddressInput.City?.trim()) {
      return
    }

    const newAddress: SupplierAddress = {
      ...currentAddressInput as SupplierAddress,
      IsPrimary: 0,
    }

    const isDuplicate = pendingAddresses.some(
      (addr) => JSON.stringify(addr) === JSON.stringify(newAddress)
    )

    if (!isDuplicate) {
      setPendingAddresses((prev) => [...prev, newAddress])
      setCurrentAddressInput(initialAddressInput)
    }
  }

  const handleRemoveFromPendingList = (addressToRemove: SupplierAddress) => {
    setPendingAddresses((prev) => prev.filter((addr) => JSON.stringify(addr) !== JSON.stringify(addressToRemove)))
  }

  const handleAddAddresses = () => {
    let addressesToSubmit = [...pendingAddresses]

    if (currentAddressInput.AddressLine1?.trim() && currentAddressInput.City?.trim()) {
      const newAddress: SupplierAddress = { ...currentAddressInput as SupplierAddress, IsPrimary: 0 }
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
    setCurrentAddressInput(initialAddressInput)
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
