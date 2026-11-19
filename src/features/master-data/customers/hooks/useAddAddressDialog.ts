import { useState } from "react"
import type { CustomerAddress } from "../models/customer"

interface UseAddAddressDialogProps {
  onAdd: (addresses: CustomerAddress[]) => void
  onClose: () => void
}

export function useAddAddressDialog({ onAdd, onClose }: UseAddAddressDialogProps) {
  const [currentAddressInput, setCurrentAddressInput] = useState<Partial<CustomerAddress>>({
    AddressType: "Billing",
    AddressLine1: "",
    AddressLine2: "",
    City: "",
    State: "",
    PostalCode: "",
  })
  const [pendingAddresses, setPendingAddresses] = useState<CustomerAddress[]>([])

  const updateCurrentAddressField = (field: keyof CustomerAddress, value: string | number | boolean) => {
    setCurrentAddressInput((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddToPendingList = () => {
    // Basic validation for AddressLine1 and City
    if (!currentAddressInput.AddressLine1?.trim() || !currentAddressInput.City?.trim()) {
      // In a real application, you might show a toast or an error message here
      return
    }

    const newAddress: CustomerAddress = {
      ...currentAddressInput as CustomerAddress,
      IsPrimary: 0, // Default to 0, primary status is managed by the parent CustomerForm
    }

    // Check for duplicates based on a simple string representation of the address
    const isDuplicate = pendingAddresses.some(
      (addr) => JSON.stringify(addr) === JSON.stringify(newAddress)
    )

    if (!isDuplicate) {
      setPendingAddresses((prev) => [...prev, newAddress])
      // Reset current address input for the next entry
      setCurrentAddressInput({
        AddressType: "Billing",
        AddressLine1: "",
        AddressLine2: "",
        City: "",
        State: "",
        PostalCode: "",
      })
    }
  }

  const handleRemoveFromPendingList = (addressToRemove: CustomerAddress) => {
    setPendingAddresses((prev) => prev.filter((addr) => JSON.stringify(addr) !== JSON.stringify(addressToRemove)))
  }

  const handleAddAddresses = () => {
    let addressesToSubmit = [...pendingAddresses]

    // If there's an address in the current input, add it to the list to submit
    if (currentAddressInput.AddressLine1?.trim() && currentAddressInput.City?.trim()) {
      const newAddress: CustomerAddress = { ...currentAddressInput as CustomerAddress, IsPrimary: 0 }
      const isDuplicate = addressesToSubmit.some((addr) => JSON.stringify(addr) === JSON.stringify(newAddress))
      if (!isDuplicate) {
        addressesToSubmit = [...addressesToSubmit, newAddress]
      }
    }

    if (addressesToSubmit.length === 0) return // No addresses to add

    onAdd(addressesToSubmit)
    handleCloseAndReset()
  }

  const handleCloseAndReset = () => {
    setPendingAddresses([])
    setCurrentAddressInput({
      AddressType: "Billing", AddressLine1: "", AddressLine2: "", City: "", State: "", PostalCode: "",
    })
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