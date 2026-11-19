import type { TyreRecord } from "../../tyres/models/tyre"

export type ContractorContact = {
  PhoneNumber: string
  IsPrimary: boolean | number
}

export type ContractorEmail = {
  EmailAddress: string
  IsPrimary: boolean | number
}

export type ContractorAddress = {
  AddressType?: string | null
  AddressLine1?: string | null
  AddressLine2?: string | null
  City?: string | null
  State?: string | null
  PostalCode?: string | null
  IsPrimary: boolean | number
}

export type ContractorPayload = {
  Name: string
  Rating?: number | null
  Contacts?: ContractorContact[]
  Emails?: ContractorEmail[]
  Addresses?: ContractorAddress[]
  TyreIDs?: number[]
}

export type ContractorRecord = ContractorPayload & {
  ID: number
  Contact?: string | null
  Email?: string | null
  Address?: string | null
  Tyres?: TyreRecord[]
}
