export type BranchContact = {
  PhoneNumber: string
  IsPrimary: boolean | number
}

export type BranchAddress = {
  AddressLine1?: string | null
  AddressLine2?: string | null
  City?: string | null
  State?: string | null
  PostalCode?: string | null
}

export type BranchPayload = {
  BranchCode: string
  BranchName: string
  Contacts?: BranchContact[]
  BillingAddress?: BranchAddress | null
  DeliveryAddress?: BranchAddress | null
}

export type BranchRecord = BranchPayload & {
  Id: number
  Contact?: string | null
  Address?: string | null
}
