export type CustomerContact = {
  PhoneNumber: string
  IsPrimary: boolean | number
}

export type CustomerEmail = {
  EmailAddress: string
  IsPrimary: boolean | number
}

export type CustomerAddress = {
  AddressType?: string | null
  AddressLine1?: string | null
  AddressLine2?: string | null
  City?: string | null
  State?: string | null
  PostalCode?: string | null
  IsPrimary: boolean | number
}

export type CustomerPayload = {
  CustomerCode: string
  Name: string
  TinNo?: string | null
  VatNo?: string | null
  NoOfInquiries?: number
  NoOfActualOrders?: number
  TotalPurchasedValue?: number
  Birthday?: string | null
  Contacts?: CustomerContact[]
  Emails?: CustomerEmail[]
  Addresses?: CustomerAddress[]
}

export type CustomerRecord = CustomerPayload & {
  /** Primary phone / address summaries returned by the list query. */
  Contact?: string | null
  Address?: string | null
  CustomerID: number
}
